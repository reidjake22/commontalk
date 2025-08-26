# Common Talk Backend

This is the backend for Common Talk, a platform for exploring UK parliamentary debates, topics, and contributors. The backend provides a REST API, data ingestion, clustering, and background job management.

## Structure

```
backend/
├── src/
│   ├── app/           # Flask API, routes, schemas
│   ├── modules/       # Data pipeline, clustering, ETL, models
│   ├── scripts/       # Jupyter notebooks and utility scripts
│   └── requirements.txt
├── run_dev.py         # Development server entrypoint
├── README.md          # Backend documentation
```

## Setup

### Prerequisites

- Python 3.10+
- PostgreSQL (see `local_db/docker-compose.yml` for local setup)
- (Optional) Docker for database

### Installation

```sh
# Install dependencies
pip install -e .


# Set up environment variables as needed:
    GROQ_API_KEY
    OPENAI_API_KEY
```

### Running the API

```sh
python run_dev.py
```

The API will start on port 5000 by default.

## Key Features

- **REST API** for debates, topics, clusters, members, jobs
- **Data ingestion** from Hansard and other sources
- **Embedding pipeline** for contributions and debates
- **Clustering** using custom algorithms and vector similarity
- **Job queue** for background clustering and analysis
- **Scripts** for experimenting during the dev process

## Main Modules

- `app/api/v1/` — API routes and schemas
- `modules/points/` — Point extraction, embedding, and generation
- `modules/cluster/` — Clustering logic, job management, store utilities
- `modules/data/` — Data scraping and ingestion
- `modules/models/` — Database models and pagination

## Data Flow

1. **Ingestion:**  
   - Data is scraped and downloaded from Hansard.
   - Stored in PostgreSQL.

2. **Processing:**  
   - Contributions and debates are embedded and clustered.
   - Clustering jobs are managed via job queue and status endpoints.

3. **Serving:**  
   - REST API provides endpoints for topics, debates, clusters, members.
   - Frontend fetches and displays data interactively.

## Development

- Scripts and notebooks for ETL and analysis are in `src/scripts/`.
- See `src/app/api/v1/topics/routes.py` for main API endpoints.
- See `src/modules/cluster/` for clustering and job logic.

## Testing

- Unit tests can be added in `src/tests/`.
- For manual testing, use the Jupyter notebooks in `src/scripts/`.

## License