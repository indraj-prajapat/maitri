import pandas as pd
import re

# Read Excel file
df = pd.read_excel(r"C:\Users\indra\OneDrive\Documents\ManualMapping.xlsx")

print("Before cleaning:")
print(df.head())

# Function to clean each cell
def clean_value(x):
    if pd.isna(x):
        return x
    x = str(x)

    # Remove everything after .  *  (  {  [  /  \
    # Note: backslash must be escaped as \\ in regex
    x = re.split(r'[.*({\[/\\]', x)[0]

    # Remove extra whitespaces
    x = x.strip()

    return x

# Apply cleaning to all columns
df = df.applymap(clean_value)



df.columns = ['targetField', 'sourceField']
# Remove duplicate rows
df = df.drop_duplicates()

print("\nAfter cleaning:")
print(df.head())


df.to_csv(r"ManualMapping/ManualMapping_cleaned.csv", index=False)

print("CSV saved successfully!")