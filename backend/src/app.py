from app.__init__ import create_app
from concurrent.futures import ThreadPoolExecutor
from modules.utils.executor_utils import init_executor


if __name__ == '__main__':
    app = create_app()
    init_executor(max_workers=2)  # tiny queue

    app.run(debug=True, threaded=True, port=5000)