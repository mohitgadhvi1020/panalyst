-- Property Analyst — Full Schema Migration
-- Run this in Supabase SQL Editor to set up all tables, indexes, and policies.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- BROKERS
-- ============================================================
CREATE TABLE brokers (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_brokers_email ON brokers(email);

-- ============================================================
-- PROPERTIES
-- ============================================================
CREATE TABLE properties (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id       UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,

    property_type   TEXT NOT NULL CHECK (property_type IN ('residential', 'commercial', 'plot', 'agriculture')),
    status          TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'rented')),

    -- Location
    city            TEXT,
    area            TEXT,
    locality        TEXT,
    address         TEXT,
    lat             DOUBLE PRECISION,
    lng             DOUBLE PRECISION,

    -- Pricing
    total_price     NUMERIC,
    price_per_sqft  NUMERIC,

    -- Dimensions
    plot_area       NUMERIC,
    built_up_area   NUMERIC,
    carpet_area     NUMERIC,

    -- Residential-specific
    bhk              INTEGER,
    furnished_status TEXT CHECK (furnished_status IS NULL OR furnished_status IN ('furnished', 'semi-furnished', 'unfurnished')),
    floor_number     INTEGER,
    total_floors     INTEGER,

    -- Agriculture / Plot
    survey_no       TEXT,

    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_properties_broker_id   ON properties(broker_id);
CREATE INDEX idx_properties_total_price ON properties(total_price);
CREATE INDEX idx_properties_area        ON properties(area);
CREATE INDEX idx_properties_survey_no   ON properties(survey_no);

-- ============================================================
-- PROPERTY OWNERS
-- ============================================================
CREATE TABLE property_owners (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id      UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    broker_id        UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    owner_name       TEXT NOT NULL,
    phone_number     TEXT,
    start_date       DATE,
    end_date         DATE,
    is_current_owner BOOLEAN DEFAULT false,
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_owners_broker_id   ON property_owners(broker_id);
CREATE INDEX idx_property_owners_property_id ON property_owners(property_id);
CREATE INDEX idx_property_owners_owner_name  ON property_owners(owner_name);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PROPERTY ACTIVITY LOG
-- ============================================================
CREATE TABLE property_logs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    broker_id     UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    action        TEXT NOT NULL,
    field_name    TEXT,
    old_value     TEXT,
    new_value     TEXT,
    description   TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_logs_property_id ON property_logs(property_id);
CREATE INDEX idx_property_logs_created_at  ON property_logs(created_at);

-- ============================================================
-- ROW LEVEL SECURITY  (defense-in-depth)
-- Our API uses the service_role key which bypasses RLS.
-- These policies ensure zero access if the anon key is ever
-- used accidentally — default-deny with no permissive policies.
-- ============================================================
ALTER TABLE brokers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_logs   ENABLE ROW LEVEL SECURITY;
