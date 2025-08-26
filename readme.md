# Common Talk

Common Talk is a full-stack project for exploring UK parliamentary debates, topics, and contributors. It provides a searchable, clustered, and regularly updated dataset from Westminster.

## Directory Structure

```
common_place/
├── backend/         # Python API, data pipeline, clustering modules
├── frontend/        # React + TypeScript client
├── local_db/        # Docker/Postgres setup
├── experiments/     # Data science notebooks
├── readme.md        # Project overview
```

## Setup

### Database

- PostgreSQL database with custom schema for debates, contributions, points, clusters, jobs.
- Local development uses Docker Compose (`local_db/docker-compose.yml`).

### Backend

- Python 3.10+
- Flask API (`backend/src/app`)
- Data ingestion, ETL, embeddings, clustering modules
- REST endpoints for debates, topics, members, jobs
- Background job queue for clustering and analysis

### Frontend

- React 18 + Vite + TypeScript (`frontend/common-talk`)
- UI for searching, browsing, and visualizing debates and topics
- Uses REST API from backend

## Data Flow

1. **Ingestion:**  
   - Data is downloaded from Hansard and other sources.
   - Stored in PostgreSQL.

2. **Processing:**  
   - Contributions and debates are embedded and clustered.
   - Clustering jobs are managed via job queue and status endpoints.

3. **Serving:**  
   - REST API provides endpoints for topics, debates, clusters, members.
   - Frontend fetches and displays data interactively.

## Features

- Search debates and topics by text, member, date, and house.
- Cluster debates and points using embeddings and custom algorithms.
- Trending topics and featured clusters.
- Daily data updates and background processing.
- Data science notebooks for analysis and experimentation.

## Development

- See [frontend/common-talk/README.md](frontend/common-talk/README.md) for UI setup.
- See [backend/readme.md](backend/readme.md) for API and data pipeline setup.

## Contributing

Pull requests and issues are welcome!  
See the individual READMEs for setup and coding guidelines.

## License

MIT

---

Files referenced:  
- [frontend/common-talk/README.md](frontend/common-talk/README.md)  
- [backend/readme.md](backend/readme.md)  