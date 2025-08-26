from flask import jsonify
from werkzeug.exceptions import HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

class ErrorSchema(BaseModel):
    error: str
    message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class ApiError(Exception):
    status_code = 400
    def __init__(self, error: str, message: str | None = None, details: dict | None = None, status_code: int | None = None):
        super().__init__(message or error)
        self.payload = {"error": error, "message": message, "details": details}
        if status_code is not None:
            self.status_code = status_code

class NotFound(ApiError):           status_code = 404
class ServiceUnavailable(ApiError): status_code = 503
class ServerError(ApiError):        status_code = 500

def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(e: ApiError):
        body = ErrorSchema.model_validate(e.payload).model_dump()
        return jsonify(body), e.status_code

    @app.errorhandler(HTTPException)
    def handle_http_exception(e: HTTPException):
        body = ErrorSchema(error=e.name, message=e.description).model_dump()
        return jsonify(body), e.code or 500

    @app.errorhandler(Exception)
    def handle_uncaught(e: Exception):
        # TODO: log with stack trace via logger.exception in a real hook
        print(f"Uncaught exception: {e} at file {__file__}")
        body = ErrorSchema(error="internal_error").model_dump()
        return jsonify(body), 500
