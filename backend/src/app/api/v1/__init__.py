from flask import Flask

def register_v1(app: Flask) -> None:
    """Register v1 API blueprints."""
    from .topics.routes import bp as topics_bp
    
    # Register blueprints with v1 prefix
    app.register_blueprint(topics_bp, url_prefix="/api/v1/topics")
    
    # Add any other v1 blueprints here
    # app.register_blueprint(other_bp, url_prefix="/api/v1/other")