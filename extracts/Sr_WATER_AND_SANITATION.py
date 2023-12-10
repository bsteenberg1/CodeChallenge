import os
import pandas as pd

# Get the current directory where the script is located
current_directory = os.path.dirname(os.path.abspath(__file__))

# Specify the input CSV file name
csv_file_name = 'sr_hex.csv'

# Construct the full path to the input CSV file
csv_path = os.path.join(current_directory, csv_file_name)

# Read the CSV file
df = pd.read_csv(csv_path)

# Use value_counts to count occurrences of each suburb and select the top 10
top_suburbs = df['official_suburb'].value_counts().nlargest(10).index

# Filter rows where 'official_suburb' is in the top 10 list and 'directorate' is 'WATER AND SANITATION'
filtered_df = df[(df['official_suburb'].isin(top_suburbs)) & (df['directorate'] == 'WATER AND SANITATION')]

# Specify the output CSV file name
filtered_csv_file_name = 'sr_hex_filteredTopTen_file.csv'

# Construct the full path to the output CSV file
filtered_csv_path = os.path.join(current_directory, filtered_csv_file_name)

# Save the filtered data to the output CSV file
filtered_df.to_csv(filtered_csv_path, index=False)

print(f"Filtered data saved to {filtered_csv_path}")

