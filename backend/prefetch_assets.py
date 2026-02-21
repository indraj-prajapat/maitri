#!/usr/bin/env python3
"""
Pre-download and validate online dependencies so the Flask app can run with minimal internet usage.

Usage (from backend directory):
  python prefetch_assets.py
  python prefetch_assets.py --skip-install
  python prefetch_assets.py --include-spacy
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

ASSET_DIR_NAME = "offline_assets"


def run(cmd: list[str], label: str) -> None:
    print(f"\n[step] {label}")
    print("[cmd]", " ".join(cmd))
    subprocess.run(cmd, check=True)


def load_env(backend_dir: Path) -> None:
    try:
        from dotenv import load_dotenv  # type: ignore
    except Exception:
        return

    env_path = backend_dir / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)


def configure_local_asset_env(backend_dir: Path) -> Path:
    asset_root = backend_dir / ASSET_DIR_NAME
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

    # ── Fix: disable XetHub CDN (causes timeouts in many regions) ──
    os.environ["HF_HUB_DISABLE_XET"] = "1"
    os.environ["HF_XET_HIGH_PERFORMANCE"] = "0"

    # ── Fix: use hf-mirror.com if HuggingFace CDN is unreachable ──
    if not os.environ.get("HF_ENDPOINT"):
        os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"
        print("[info] HF_ENDPOINT set to hf-mirror.com (override with HF_ENDPOINT env var)")

    os.environ["HF_HUB_DOWNLOAD_TIMEOUT"] = "120"

    print("[ok] Local asset cache configured:", asset_root)
    print("[ok] Models will download to:", st_home)
    return asset_root


def ensure_backend_venv(backend_dir: Path) -> Path:
    venv_dir = backend_dir / "venv"
    if os.name == "nt":
        venv_python = venv_dir / "Scripts" / "python.exe"
    else:
        venv_python = venv_dir / "bin" / "python"

    if not venv_python.exists():
        run([sys.executable, "-m", "venv", str(venv_dir)], "Creating backend venv")
    else:
        print("[ok] Using existing backend venv:", venv_dir)

    if not venv_python.exists():
        raise RuntimeError(f"Venv Python not found at {venv_python}")
    return venv_python


def ensure_groq_env() -> None:
    groq_key = os.getenv("groq_api_key", "").strip()
    grok_key = os.getenv("grok_api_key", "").strip()

    if groq_key and not grok_key:
        os.environ["grok_api_key"] = groq_key
    elif grok_key and not groq_key:
        os.environ["groq_api_key"] = grok_key

    final_groq = os.getenv("groq_api_key", "").strip()
    final_grok = os.getenv("grok_api_key", "").strip()

    if final_groq or final_grok:
        print("[ok] Groq key detected in environment (groq_api_key/grok_api_key).")
    else:
        print("[warn] No Groq key found. Set groq_api_key (and optionally grok_api_key) in backend/.env")


def warm_sentence_transformers(venv_python: Path, model_name: str, st_home: Path) -> None:
    print(f"\n[step] Downloading sentence-transformers model: {model_name}")
    print(f"[info] Target directory: {st_home}")

    # Pass all required env vars explicitly into the subprocess
    env_exports = (
        f"import os;"
        f"os.environ['HF_HUB_DISABLE_XET']='1';"
        f"os.environ['HF_XET_HIGH_PERFORMANCE']='0';"
        f"os.environ['HF_ENDPOINT']='{os.environ.get('HF_ENDPOINT', 'https://hf-mirror.com')}';"
        f"os.environ['SENTENCE_TRANSFORMERS_HOME']=r'{st_home}';"
        f"os.environ['HF_HOME']=r'{st_home.parent / 'hf_home'}';"
        f"os.environ['HUGGINGFACE_HUB_CACHE']=r'{st_home.parent / 'hf_home' / 'hub'}';"
        f"os.environ['HF_HUB_DOWNLOAD_TIMEOUT']='120';"
    )

    code = (
        f"{env_exports}"
        f"from sentence_transformers import SentenceTransformer;"
        f"print('[info] Downloading to:', r'{st_home}');"
        f"m = SentenceTransformer('{model_name}', cache_folder=r'{st_home}');"
        f"m.encode(['prefetch'], show_progress_bar=False);"
        f"print('[ok] sentence-transformers model cached at: {st_home}')"
    )
    run([str(venv_python), "-c", code], "Warming sentence-transformers cache")


def warm_spacy_model(venv_python: Path) -> None:
    print("\n[step] Optional spaCy model warmup: en_core_web_md")
    check_code = (
        "import importlib.util,sys;"
        "sys.exit(0 if importlib.util.find_spec('spacy') else 2)"
    )
    probe = subprocess.run([str(venv_python), "-c", check_code], check=False)
    if probe.returncode != 0:
        print("[skip] spaCy is not installed in backend/venv. Add `spacy` to requirements if needed.")
        return

    verify_code = (
        "import spacy,sys;"
        "spacy.load('en_core_web_md');"
        "print('[ok] spaCy model is cached.')"
    )
    verify = subprocess.run([str(venv_python), "-c", verify_code], check=False)
    if verify.returncode == 0:
        return

    run([str(venv_python), "-m", "spacy", "download", "en_core_web_md"], "Downloading spaCy model en_core_web_md")
    run([str(venv_python), "-c", verify_code], "Verifying spaCy model")


def main() -> int:
    parser = argparse.ArgumentParser(description="Prefetch online dependencies for backend app")
    parser.add_argument(
        "--skip-install",
        action="store_true",
        help="Skip pip install -r requirements.txt",
    )
    parser.add_argument(
        "--include-spacy",
        action="store_true",
        help="Also install/download spaCy model en_core_web_md if spaCy exists",
    )
    parser.add_argument(
        "--model",
        default="all-MiniLM-L6-v2",
        help="Sentence-Transformers model to prefetch (default: all-MiniLM-L6-v2)",
    )
    parser.add_argument(
        "--no-mirror",
        action="store_true",
        help="Disable hf-mirror.com fallback and use official HuggingFace endpoint",
    )
    args = parser.parse_args()

    backend_dir = Path(__file__).resolve().parent
    os.chdir(backend_dir)

    print("[info] Backend directory:", backend_dir)
    load_env(backend_dir)

    # Allow --no-mirror to skip mirror override
    if args.no_mirror:
        os.environ["HF_ENDPOINT"] = "https://huggingface.co"
        print("[info] Using official HuggingFace endpoint (--no-mirror)")

    asset_root = configure_local_asset_env(backend_dir)
    st_home = asset_root / "sentence_transformers"

    venv_python = ensure_backend_venv(backend_dir)
    ensure_groq_env()

    req_path = backend_dir / "requirements.txt"
    if req_path.exists() and not args.skip_install:
        run([str(venv_python), "-m", "pip", "install", "--upgrade", "pip"], "Upgrading pip in backend venv")
        run([str(venv_python), "-m", "pip", "install", "-r", str(req_path)], "Installing requirements in backend venv")
    elif not req_path.exists():
        print("[warn] requirements.txt not found. Skipping install.")

    warm_sentence_transformers(venv_python, args.model, st_home)

    if args.include_spacy:
        warm_spacy_model(venv_python)

    print("\n[done] Prefetch complete.")
    print("[info] Cached assets location:", asset_root)
    print("[info] Model saved to:", st_home)
    print("[info] Venv Python used:", venv_python)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        print(f"\n[error] Command failed with exit code {exc.returncode}")
        raise
    except Exception as exc:
        print(f"\n[error] {exc}")
        raise