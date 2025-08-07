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

CREATE INDEX ON debate(analysed);