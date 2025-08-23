from flask import Blueprint, request, Response
import requests

bp = Blueprint("hansard_proxy", __name__)
HANSARD_BASE = "https://hansard-api.parliament.uk"

@bp.route("/debates/<path:subpath>")
def debates_proxy(subpath):
    # Forward everything after /debates/ to Hansard
    url = f"{HANSARD_BASE}/{subpath}"
    print(url)
    r = requests.get(url, params=request.args, timeout=10)
    resp = Response(r.content, status=r.status_code,
                    content_type=r.headers.get("Content-Type", "application/json"))
    resp.headers["Access-Control-Allow-Origin"] = "https://commontalk.co.uk"
    resp.headers["Vary"] = "Origin"
    resp.headers["Cache-Control"] = "public, max-age=300"
    return resp