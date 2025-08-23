from flask import Flask

def register_v1(app: Flask) -> None:
    """Register v1 API blueprints."""
    from .topics.routes import bp as topics_bp
    from .polling.routes import bp as polling_bp
    from .search.routes import bp as search_bp
    from .hansard_proxy.routes import bp as hansard_bp
    # Register blueprints with v1 prefix
    app.register_blueprint(hansard_bp, url_prefix="/api/v1/hansard")
    app.register_blueprint(topics_bp, url_prefix="/api/v1/topics")
    app.register_blueprint(polling_bp, url_prefix="/api/v1/polling")
    app.register_blueprint(search_bp, url_prefix="/api/v1/search")
    # Add any other v1 blueprints here
    # app.register_blueprint(other_bp, url_prefix="/api/v1/other")