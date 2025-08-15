# src/app/__init__.py
from flask import Flask
from spectree import SpecTree
from .common.errors import register_error_handlers
from .logging import configure_logging
from flask_cors import CORS

api_spec = SpecTree("flask", title="Common Talk API", version="1.0.0", path="apidoc", mode="strict")

def create_app() -> Flask:
    configure_logging()
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:5173"])  # Allow your frontend dev server

    from .api.v1 import register_v1
    register_error_handlers(app)
    register_v1(app)
    
    @app.route('/health')
    def health_check():
        return {"status": "ok"}, 200
    
    api_spec.register(app)
    return app
