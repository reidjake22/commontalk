from flask import Flask, jsonify
from datetime import datetime, timedelta
from modules.cluster.run import run_clustering
from modules.api.cluster import get_or_create_weekly_clustering
app = Flask(__name__)

app.add_url_rule('/', 'weekly_clustering', get_or_create_weekly_clustering, defaults={'target_date': None})
app.add_url_rule('/<target_date>', 'weekly_clustering_date', get_or_create_weekly_clustering)


if __name__ == '__main__':
    app.run(debug=True)