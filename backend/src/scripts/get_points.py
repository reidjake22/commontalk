import sys
import os
from dotenv import load_dotenv
load_dotenv()

from modules.data.download import download_data
download_data("2025-06-01", "2025-07-01")

from modules.points.generate import generate_points
print("generating points")
generate_points(batch_size=200, filters={"start_date": "2025-06-01", "end_date": "2025-07-01"})
