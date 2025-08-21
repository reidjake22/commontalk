# File: backend/src/app.py
from app import create_app
from concurrent.futures import ThreadPoolExecutor

if __name__ == '__main__':
    application = create_app()

    application.run(debug=True, threaded=True, port=5000)