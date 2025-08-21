from dotenv import load_dotenv
from src.app import create_app
load_dotenv()  # finds backend/.env by walking up from CWD

app = create_app()
