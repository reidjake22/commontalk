from app.__init__ import create_app
from concurrent.futures import ThreadPoolExecutor

if __name__ == '__main__':
    app = create_app()

    app.run(debug=True, threaded=True, port=5000)