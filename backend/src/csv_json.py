import io
import pandas as pd 

def csv_to_json(file):
    """Convert a CSV file into dict: {col1_row1: col2_row1, ...}"""
    df = pd.read_csv(io.StringIO(file.read().decode('utf-8')))
    df = df.dropna(how='all')

    if df.shape[1] < 2:
        raise ValueError(f"CSV file {file.filename} must have at least 2 columns")

    col1, col2 = df.columns[0], df.columns[1]
    result = {}
    for _, row in df.iterrows():
        key = f"{col1}_{row[col1]}"
        result[key] = row[col2]
    return result

data = pd.read_csv(r"C:\Users\Indraj\OneDrive\matri_check.csv")
jso = csv_to_json(data)
print(jso)