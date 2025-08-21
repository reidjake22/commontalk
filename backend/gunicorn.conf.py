# /etc/commontalk.gunicorn.py (or backend/gunicorn.conf.py)
bind = "0.0.0.0:8080"
workers = 4           # ≈ 2*CPU + 1; tune for your box
threads = 2
worker_class = "gthread"
timeout = 120
keepalive = 5
accesslog = "-"       # stdout
errorlog = "-"        # stderr
loglevel = "info"
max_requests = 2000   # recycle workers to avoid leaks
max_requests_jitter = 200
