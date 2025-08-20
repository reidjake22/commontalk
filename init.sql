CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE party (
    party_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(20),
    background_colour VARCHAR(7),
    foreground_colour VARCHAR(7),
    is_lords_main_party BOOLEAN DEFAULT FALSE,
    is_lords_spiritual_party BOOLEAN DEFAULT FALSE,
    government_type VARCHAR(50),
    is_independent_party BOOLEAN DEFAULT FALSE
);

CREATE TABLE member (
    member_id VARCHAR(255) PRIMARY KEY,
    name_list_as VARCHAR(255),
    name_display_as VARCHAR(255) NOT NULL,
    name_full_title VARCHAR(255),
    name_address_as VARCHAR(255),
    latest_party_membership VARCHAR(100) REFERENCES party(party_id),
    latest_house_membership_id VARCHAR(255),
    thumbnail_url TEXT,
    gender VARCHAR(1),
    membership_from VARCHAR(255),
    membership_start_date TIMESTAMP,
    membership_end_date TIMESTAMP,
    house INTEGER,
    status_is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE debate (
    ext_id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    date TIMESTAMP NOT NULL,
    house VARCHAR(50),
    location VARCHAR(255),
    debate_type_id VARCHAR(20),
    parent_ext_id VARCHAR(255) REFERENCES debate(ext_id),
    analysed BOOLEAN DEFAULT FALSE
);

CREATE TABLE contribution (
    item_id VARCHAR(255) PRIMARY KEY,
    ext_id VARCHAR(255),
    contribution_type VARCHAR(50),
    debate_ext_id VARCHAR(255) REFERENCES debate(ext_id),
    member_id VARCHAR(255) REFERENCES member(member_id),
    attributed_to VARCHAR(255),
    contribution_value TEXT,
    order_in_section INTEGER,
    timecode VARCHAR(50),
    hrs_tag VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE point(
    point_id BIGSERIAL PRIMARY KEY,
    contribution_item_id VARCHAR(255) REFERENCES contribution(item_id),
    point_value TEXT,
    point_embedding VECTOR(3072)
);

CREATE TABLE clusters (
    cluster_id SERIAL PRIMARY KEY,
    parent_cluster_id INTEGER REFERENCES clusters(cluster_id),
    title VARCHAR(255),
    summary TEXT,
    layer INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- Use TIMESTAMPTZ, not TEXT
    filters_used JSONB,
    config JSONB DEFAULT '{}'::jsonb,  -- Add this line
    job_id BIGINT REFERENCES cluster_jobs(job_id),
    is_draft BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE cluster_jobs (
  job_id        BIGSERIAL PRIMARY KEY,
  status        TEXT NOT NULL CHECK (status IN ('queued','running','complete','failed','canceled')),
  root_cluster_id INTEGER REFERENCES clusters(cluster_id) ON DELETE SET NULL,
  params        JSONB NOT NULL,           -- search, filters, config
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at    TIMESTAMPTZ,
  finished_at   TIMESTAMPTZ,
  error         TEXT
);

CREATE TABLE cluster_points (
    cluster_id INTEGER REFERENCES clusters(cluster_id) ON DELETE CASCADE,
    point_id BIGINT REFERENCES point(point_id) ON DELETE CASCADE,
    PRIMARY KEY (cluster_id, point_id)
);


-- ESSENTIAL INDEXES (huge performance gains for clustering):

-- Clustering tree traversal
CREATE INDEX idx_clusters_parent ON clusters(parent_cluster_id);
CREATE INDEX idx_clusters_layer ON clusters(layer);

-- Point-cluster relationships (junction table)
CREATE INDEX idx_cluster_points_cluster ON cluster_points(cluster_id);
CREATE INDEX idx_cluster_points_point ON cluster_points(point_id);

-- Data retrieval for clustering
CREATE INDEX idx_contribution_debate ON contribution(debate_ext_id);
CREATE INDEX idx_contribution_member ON contribution(member_id);
CREATE INDEX idx_point_contribution ON point(contribution_item_id);

-- Date filtering (your main filter)
CREATE INDEX idx_debate_date ON debate(date);
CREATE INDEX idx_debate_house ON debate(house);

-- NICE TO HAVE INDEXES:

-- Cluster analysis/reporting
CREATE INDEX idx_clusters_created_at ON clusters(created_at);

-- Member analysis
CREATE INDEX idx_member_party ON member(latest_party_membership);
CREATE INDEX idx_member_house ON member(house);

-- Contribution analysis
CREATE INDEX idx_contribution_type ON contribution(contribution_type);

-- Vector similarity searches (if you do embedding similarity)
CREATE INDEX idx_point_embedding ON point USING hnsw (point_embedding vector_cosine_ops);

-- Composite indexes for common query patterns
CREATE INDEX idx_debate_house_date ON debate(house, date);
CREATE INDEX idx_contribution_debate_member ON contribution(debate_ext_id, member_id);
