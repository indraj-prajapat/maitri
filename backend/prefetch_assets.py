import argparse
import os
import subprocess
import sys
from pathlib import Path


def run(cmd: list[str], label: str, env: dict[str, str] | None = None) -> None:
    print(f"\n[step] {label}")
    print("[cmd]", " ".join(cmd))
    subprocess.run(cmd, check=True, env=env)


def configure_local_asset_env(backend_dir: Path, use_mirror: bool) -> tuple[Path, Path]:
    asset_root = backend_dir / "offline_assets"
    hf_home = asset_root / "hf_home"
    st_home = asset_root / "sentence_transformers"
    torch_home = asset_root / "torch_home"
    xdg_cache = asset_root / "xdg_cache"
    spacy_data = asset_root / "spacy_data"

    for p in (asset_root, hf_home, st_home, torch_home, xdg_cache, spacy_data):
        p.mkdir(parents=True, exist_ok=True)

    os.environ["BACKEND_ASSET_ROOT"] = str(asset_root)
    os.environ["HF_HOME"] = str(hf_home)
    os.environ["HUGGINGFACE_HUB_CACHE"] = str(hf_home / "hub")
    os.environ["SENTENCE_TRANSFORMERS_HOME"] = str(st_home)
    os.environ["TORCH_HOME"] = str(torch_home)
    os.environ["XDG_CACHE_HOME"] = str(xdg_cache)
    os.environ["SPACY_DATA"] = str(spacy_data)

    os.environ["HF_HUB_DISABLE_XET"] = "1"
    os.environ["HF_XET_HIGH_PERFORMANCE"] = "0"

    if use_mirror and not os.environ.get("HF_ENDPOINT"):
        os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"
        print("[info] HF_ENDPOINT set to hf-mirror.com (override with HF_ENDPOINT env var)")

    os.environ["HF_HUB_DOWNLOAD_TIMEOUT"] = "120"

    print("[ok] Local asset cache configured:", asset_root)
    print("[ok] Models will download to:", st_home)
    return asset_root, st_home


def ensure_backend_venv(backend_dir: Path) -> Path:
    venv_dir = backend_dir / "venv"
    if os.name == "nt":
        venv_python = venv_dir / "Scripts" / "python.exe"
    else:
        venv_python = venv_dir / "bin" / "python"

    if not venv_python.exists():
        run([sys.executable, "-m", "venv", str(venv_dir)], "Creating backend venv")

    if not venv_python.exists():
        raise RuntimeError(f"Venv Python not found at {venv_python}")

    print("[ok] Using backend venv:", venv_dir)
    return venv_python


def warm_sentence_transformers(venv_python: Path, model_name: str, env: dict[str, str]) -> None:
    code = (
        "from sentence_transformers import SentenceTransformer;"
        f"SentenceTransformer('{model_name}')"
    )
    run([str(venv_python), "-c", code], f"Downloading sentence-transformers model: {model_name}", env=env)


def warm_spacy_model(venv_python: Path, env: dict[str, str]) -> None:
    run([str(venv_python), "-m", "spacy", "download", "en_core_web_md"], "Downloading spaCy model en_core_web_md", env=env)


def main() -> int:
    parser = argparse.ArgumentParser(description="Prefetch online dependencies for backend app")
    parser.add_argument("--skip-install", action="store_true")
    parser.add_argument("--include-spacy", action="store_true")
    parser.add_argument("--model", default="all-MiniLM-L6-v2")
    parser.add_argument("--no-mirror", action="store_true")
    args = parser.parse_args()

    backend_dir = Path(__file__).resolve().parent
    os.chdir(backend_dir)

    use_mirror = not args.no_mirror
    configure_local_asset_env(backend_dir, use_mirror)

    venv_python = ensure_backend_venv(backend_dir)

    venv_dir = backend_dir / "venv"
    env = os.environ.copy()
    env["VIRTUAL_ENV"] = str(venv_dir)
    path_key = "PATH"
    venv_bin = venv_dir / ("Scripts" if os.name == "nt" else "bin")
    env[path_key] = str(venv_bin) + os.pathsep + env.get(path_key, "")

    req_path = backend_dir / "requirements.txt"
    if req_path.exists() and not args.skip_install:
        run([str(venv_python), "-m", "pip", "install", "--upgrade", "pip"], "Upgrading pip in backend venv", env=env)
        run([str(venv_python), "-m", "pip", "install", "-r", str(req_path)], "Installing requirements in backend venv", env=env)

    warm_sentence_transformers(venv_python, args.model, env)

    if args.include_spacy:
        warm_spacy_model(venv_python, env)

    print("\n[done] Prefetch complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
