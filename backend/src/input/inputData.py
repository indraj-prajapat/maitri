import pandas as pd
import json
import xmltodict
import io
from typing import Dict, List, Any, Union


class FileToJson:
    """
    Convert an uploaded file (CSV, XLSX, JSON, XML) into:
      ✓ key-value dict  -> to_key_val()
      ✓ metadata list   -> to_meta()
    """

    def __init__(self, uploaded_file: Union[io.BytesIO, Any]):
        self.file = uploaded_file
        self.filename = getattr(uploaded_file, "filename", "uploaded_file").lower()

    # ------------------------------------------------------------------
    # Internal file reader
    # ------------------------------------------------------------------
    def _read(self) -> pd.DataFrame:
        """Read any supported file type and return a DataFrame."""
        f = self.file
        name = self.filename
        f.seek(0)

        if name.endswith(".csv"):
            return pd.read_csv(f)

        elif name.endswith(".xlsx"):
            return pd.read_excel(f)

        elif name.endswith(".json"):
            data = json.load(f)
            return pd.json_normalize(data)

        elif name.endswith(".xml"):
            xml_content = f.read().decode("utf-8")
            data = xmltodict.parse(xml_content)

            # Extract list of records if possible
            if "Records" in data and "Record" in data["Records"]:
                records = data["Records"]["Record"]
                # Ensure records is a list
                if not isinstance(records, list):
                    records = [records]
                return pd.DataFrame(records)

            # Fallback: flatten the whole XML
            return pd.json_normalize(data)

        else:
            raise ValueError(f"Unsupported file format: {name}")

    # ------------------------------------------------------------------
    # Normalize column names -> ensure field_name, data, m_n exist
    # ------------------------------------------------------------------
    def _normalise_cols(self, df: pd.DataFrame) -> pd.DataFrame:
        """Rename columns to lowercase field_name, data, m/n."""
        # 1. clean spaces and case
        df = df.rename(columns=lambda c: c.strip().lower())

        # 2. build lookup (lower -> original) on the already-clean names
        cols = {c: c for c in df.columns}
        print("Columns after initial clean:", cols)
        # 3. required keys now match exactly
        required = {"field_name", "data", "m_n"}
        missing = required - cols.keys()
        if missing:
            raise KeyError(f"Missing required columns: {', '.join(missing)}")

        # 4. final rename to canonical names
        return df.rename(columns={
            "field_name": "field_name",
            "data": "data",
            "m_n": "m/n"
        })

    # ------------------------------------------------------------------
    # Public: Key → Value mapping
    # ------------------------------------------------------------------
    def to_key_val(self) -> Dict[str, str]:
        df = self._normalise_cols(self._read())
        return {
            str(row["field_name"]).strip(): str(row["data"]).strip()
            for _, row in df.iterrows()
        }

    # ------------------------------------------------------------------
    # Public: Metadata list format
    # ------------------------------------------------------------------
    def to_meta(self) -> List[Dict[str, str]]:
        df = self._normalise_cols(self._read())
        return [
            {"field_name": str(row["field_name"]).strip(),
             "m/n": str(row["m/n"]).strip()}
            for _, row in df.iterrows()
        ]