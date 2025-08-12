from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
from modules.cluster.run import run_clustering
from modules.api.cluster import get_or_create_weekly_clustering, retrieve_cluster
from modules.api.featured import get_featured_topics

app = Flask(__name__)

CORS(app)
app.add_url_rule('/', 'weekly_clustering', get_or_create_weekly_clustering, defaults={'target_date': None})
app.add_url_rule('/<target_date>', 'weekly_clustering_date', get_or_create_weekly_clustering)
app.add_url_rule('/api/featured/topics', 'api_featured_topics', get_featured_topics, methods=['GET'])
app.add_url_rule('/api/topics/<int:cluster_id>', 'api_topic', retrieve_cluster, methods=['GET'])

if __name__ == '__main__':
    app.run(debug=True)