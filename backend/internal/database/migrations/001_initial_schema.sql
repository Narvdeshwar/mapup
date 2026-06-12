CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    polygon GEOMETRY(POLYGON,4326) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_geo_polygon ON geofences USING GIST (polygon);

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY,
    vehicle_number VARCHAR(100) UNIQUE NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_locations (
    id UUID PRIMARY KEY,
    vehicle_id UUID REFERENCES vehicles(id),
    location GEOMETRY(POINT,4326) NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicle_location ON vehicle_locations USING GIST (location);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY,
    geofence_id UUID REFERENCES geofences(id),
    vehicle_id UUID NULL REFERENCES vehicles(id),
    event_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS violations (
    id UUID PRIMARY KEY,
    vehicle_id UUID REFERENCES vehicles(id),
    geofence_id UUID REFERENCES geofences(id),
    event_type VARCHAR(20) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    timestamp TIMESTAMP NOT NULL
);
