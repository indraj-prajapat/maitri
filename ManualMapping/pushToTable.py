import sys, os

# Add ROOT folder (matri) to Python path
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(ROOT)

from backend.src.DataBase.databse import PastMapping, SessionLocal, init_db
import pandas as pd

def push_to_past_mapping(df):
    # Ensure tables exist
    init_db()

    session = SessionLocal()

    try:
        records = []
        for _, row in df.iterrows():
            record = PastMapping(
                source_key=row['sourceField'],
                target_key=row['targetField'],
                number=2
            )
            records.append(record)

        session.add_all(records)
        session.commit()
        print(f"Inserted {len(records)} rows into past_mapping table.")

    except Exception as e:
        session.rollback()
        print("Error:", e)
    finally:
        session.close()



df = pd.read_csv(r"ManualMapping/ManualMapping_cleaned.csv")
push_to_past_mapping(df)