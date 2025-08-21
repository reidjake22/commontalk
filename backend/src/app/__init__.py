# src/app/__init__.py
from flask import Flask
from .common.errors import register_error_handlers
from .logging import configure_logging
from flask_cors import CORS
from modules.utils.executor_utils import init_executor
from modules.utils.job_utils import clear_jobs_on_startup

def create_app() -> Flask:
    configure_logging()
    clear_jobs_on_startup()
    application = Flask(__name__)
    CORS(application, origins=["https://commontalk.co.uk","https://www.commontalk.co.uk"])
    init_executor(max_workers=2)  # Initialize executor with a small queue size
    from .api.v1 import register_v1
    register_error_handlers(application)
    register_v1(application)
    
    @application.route('/health')
    def health_check():
        return {"status": "ok"}, 200

    return application
