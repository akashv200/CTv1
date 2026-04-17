--
-- PostgreSQL database dump
--

\restrict 5HCurhBWwmprBvBPLmWNjQmkT7i96dZcSSBjb6mPyjEZc6XTZVsmLviqCHsj3QW

-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agriculture_companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agriculture_companies (
    company_id text NOT NULL,
    farm_count integer DEFAULT 0 NOT NULL,
    total_farm_area_hectares double precision,
    primary_crops jsonb DEFAULT '[]'::jsonb NOT NULL,
    soil_profile jsonb DEFAULT '{}'::jsonb NOT NULL,
    irrigation_methods jsonb DEFAULT '[]'::jsonb NOT NULL,
    pesticide_policy text,
    organic_certifications jsonb DEFAULT '[]'::jsonb NOT NULL,
    weather_station_enabled boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agriculture_companies OWNER TO postgres;

--
-- Name: ai_anomaly_insights; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_anomaly_insights (
    id bigint NOT NULL,
    product_id text,
    checkpoint_id text,
    company_id text,
    domain text,
    anomaly_type text NOT NULL,
    severity text DEFAULT 'warning'::text NOT NULL,
    score double precision,
    title text NOT NULL,
    description text,
    suggested_action text,
    model_version text,
    status text DEFAULT 'open'::text NOT NULL,
    detected_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT ai_anomaly_severity_check CHECK ((severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))),
    CONSTRAINT ai_anomaly_status_check CHECK ((status = ANY (ARRAY['open'::text, 'acknowledged'::text, 'resolved'::text, 'false_positive'::text])))
);


ALTER TABLE public.ai_anomaly_insights OWNER TO postgres;

--
-- Name: ai_anomaly_insights_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_anomaly_insights_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_anomaly_insights_id_seq OWNER TO postgres;

--
-- Name: ai_anomaly_insights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_anomaly_insights_id_seq OWNED BY public.ai_anomaly_insights.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    actor_id text,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: checkpoints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.checkpoints (
    id text NOT NULL,
    product_id text NOT NULL,
    checkpoint_type text NOT NULL,
    location text NOT NULL,
    latitude double precision,
    longitude double precision,
    notes text,
    temperature double precision,
    humidity double precision,
    shock double precision,
    iot_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    image_urls jsonb DEFAULT '[]'::jsonb NOT NULL,
    data_hash text,
    blockchain_tx_hash text,
    added_by text NOT NULL,
    verified boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT checkpoints_type_check CHECK ((checkpoint_type = ANY (ARRAY['received'::text, 'quality-check'::text, 'processed'::text, 'dispatched'::text, 'in-transit'::text, 'delivered'::text])))
);


ALTER TABLE public.checkpoints OWNER TO postgres;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id text NOT NULL,
    company_code text NOT NULL,
    domain text NOT NULL,
    company_name text NOT NULL,
    legal_name text,
    registration_number text,
    tax_id text,
    contact_email text,
    contact_phone text,
    website text,
    country text,
    state text,
    city text,
    address_line1 text,
    postal_code text,
    status text DEFAULT 'active'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT companies_domain_check CHECK ((domain = ANY (ARRAY['agriculture'::text, 'pharmaceutical'::text, 'food'::text, 'ecommerce'::text, 'warehouse'::text]))),
    CONSTRAINT companies_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text])))
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: ecommerce_companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ecommerce_companies (
    company_id text NOT NULL,
    marketplace_type text,
    seller_verification_level text,
    anti_counterfeit_program boolean DEFAULT false NOT NULL,
    warranty_supported boolean DEFAULT false NOT NULL,
    return_window_days integer,
    fulfillment_model text,
    supported_regions jsonb DEFAULT '[]'::jsonb NOT NULL,
    avg_authenticity_score double precision,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ecommerce_companies OWNER TO postgres;

--
-- Name: food_safety_companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.food_safety_companies (
    company_id text NOT NULL,
    fssai_license_no text,
    iso_22000_certified boolean DEFAULT false NOT NULL,
    haccp_certified boolean DEFAULT false NOT NULL,
    allergen_program boolean DEFAULT false NOT NULL,
    contamination_test_lab boolean DEFAULT false NOT NULL,
    recall_sop_version text,
    avg_processing_tons_per_day double precision,
    nutrition_label_standard text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.food_safety_companies OWNER TO postgres;

--
-- Name: inventory_stock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_stock (
    id text NOT NULL,
    company_id text NOT NULL,
    warehouse_layout_id text,
    product_id text,
    sku text NOT NULL,
    rack_row_bin text,
    lot_number text,
    serial_number text,
    quantity double precision DEFAULT 0 NOT NULL,
    reorder_point double precision DEFAULT 0 NOT NULL,
    max_capacity double precision,
    status text DEFAULT 'optimal'::text NOT NULL,
    last_movement_at timestamp with time zone,
    expiry_date date,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT inventory_status_check CHECK ((status = ANY (ARRAY['optimal'::text, 'low'::text, 'out'::text, 'overstock'::text, 'quarantine'::text])))
);


ALTER TABLE public.inventory_stock OWNER TO postgres;

--
-- Name: iot_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.iot_devices (
    id text NOT NULL,
    company_id text,
    domain text NOT NULL,
    device_code text NOT NULL,
    device_name text NOT NULL,
    mqtt_client_id text,
    mqtt_topic text,
    sensor_type text DEFAULT 'env'::text NOT NULL,
    status text DEFAULT 'offline'::text NOT NULL,
    last_seen_at timestamp with time zone,
    firmware_version text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT iot_devices_domain_check CHECK ((domain = ANY (ARRAY['agriculture'::text, 'pharmaceutical'::text, 'food'::text, 'ecommerce'::text, 'warehouse'::text]))),
    CONSTRAINT iot_devices_status_check CHECK ((status = ANY (ARRAY['online'::text, 'offline'::text, 'fault'::text, 'maintenance'::text])))
);


ALTER TABLE public.iot_devices OWNER TO postgres;

--
-- Name: notification_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_events (
    id bigint NOT NULL,
    channel text DEFAULT 'in_app'::text NOT NULL,
    event_type text NOT NULL,
    domain text,
    company_id text,
    product_id text,
    checkpoint_id text,
    severity text DEFAULT 'info'::text NOT NULL,
    recipient_id text,
    recipient_address text,
    title text NOT NULL,
    message text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    delivery_status text DEFAULT 'queued'::text NOT NULL,
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,
    acknowledged_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notification_channel_check CHECK ((channel = ANY (ARRAY['in_app'::text, 'email'::text, 'sms'::text, 'push'::text, 'whatsapp'::text, 'telegram'::text, 'websocket'::text]))),
    CONSTRAINT notification_delivery_status_check CHECK ((delivery_status = ANY (ARRAY['queued'::text, 'sent'::text, 'delivered'::text, 'failed'::text, 'acknowledged'::text]))),
    CONSTRAINT notification_severity_check CHECK ((severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text])))
);


ALTER TABLE public.notification_events OWNER TO postgres;

--
-- Name: notification_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_events_id_seq OWNER TO postgres;

--
-- Name: notification_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_events_id_seq OWNED BY public.notification_events.id;


--
-- Name: pharmaceutical_companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pharmaceutical_companies (
    company_id text NOT NULL,
    manufacturing_license_no text,
    gmp_certified boolean DEFAULT false NOT NULL,
    fda_registration_no text,
    cold_chain_supported boolean DEFAULT false NOT NULL,
    storage_temp_min_c double precision,
    storage_temp_max_c double precision,
    active_ingredient_catalog jsonb DEFAULT '[]'::jsonb NOT NULL,
    adverse_event_contact text,
    pharmacovigilance_program boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pharmaceutical_companies OWNER TO postgres;

--
-- Name: product_lineage_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_lineage_events (
    id bigint NOT NULL,
    source_product_id text,
    target_product_id text,
    transformation_type text NOT NULL,
    quantity_in double precision,
    quantity_out double precision,
    unit text,
    event_location text,
    performed_by text,
    process_metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    blockchain_tx_hash text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT product_lineage_transform_check CHECK ((transformation_type = ANY (ARRAY['processed'::text, 'merged'::text, 'split'::text, 'repacked'::text, 'relabeled'::text, 'assembled'::text])))
);


ALTER TABLE public.product_lineage_events OWNER TO postgres;

--
-- Name: product_lineage_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_lineage_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_lineage_events_id_seq OWNER TO postgres;

--
-- Name: product_lineage_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_lineage_events_id_seq OWNED BY public.product_lineage_events.id;


--
-- Name: product_recalls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_recalls (
    id text NOT NULL,
    recall_code text NOT NULL,
    product_id text,
    company_id text,
    reason text NOT NULL,
    severity text DEFAULT 'high'::text NOT NULL,
    status text DEFAULT 'initiated'::text NOT NULL,
    initiated_by text,
    initiated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    impacted_batches jsonb DEFAULT '[]'::jsonb NOT NULL,
    corrective_actions jsonb DEFAULT '[]'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT recalls_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT recalls_status_check CHECK ((status = ANY (ARRAY['initiated'::text, 'active'::text, 'resolved'::text, 'cancelled'::text])))
);


ALTER TABLE public.product_recalls OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id text NOT NULL,
    product_id text NOT NULL,
    domain text NOT NULL,
    product_name text NOT NULL,
    category text,
    description text,
    batch_number text NOT NULL,
    serial_number text,
    quantity double precision NOT NULL,
    unit text NOT NULL,
    origin_location text NOT NULL,
    organization_id text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    certifications jsonb DEFAULT '[]'::jsonb NOT NULL,
    ipfs_hash text,
    blockchain_tx_hash text,
    authenticity_score integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_by text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_domain_check CHECK ((domain = ANY (ARRAY['agriculture'::text, 'pharmaceutical'::text, 'food'::text, 'ecommerce'::text, 'warehouse'::text]))),
    CONSTRAINT products_status_check CHECK ((status = ANY (ARRAY['active'::text, 'warning'::text, 'critical'::text, 'recalled'::text])))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: qr_verification_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qr_verification_logs (
    id bigint NOT NULL,
    product_id text,
    verification_token text,
    source_channel text DEFAULT 'web'::text NOT NULL,
    status text DEFAULT 'verified'::text NOT NULL,
    trust_score integer,
    consumer_wallet text,
    device_fingerprint text,
    ip_address text,
    geo jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT qr_source_channel_check CHECK ((source_channel = ANY (ARRAY['web'::text, 'mobile'::text, 'api'::text, 'scanner'::text]))),
    CONSTRAINT qr_status_check CHECK ((status = ANY (ARRAY['verified'::text, 'warning'::text, 'suspicious'::text, 'not_found'::text])))
);


ALTER TABLE public.qr_verification_logs OWNER TO postgres;

--
-- Name: qr_verification_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.qr_verification_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.qr_verification_logs_id_seq OWNER TO postgres;

--
-- Name: qr_verification_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.qr_verification_logs_id_seq OWNED BY public.qr_verification_logs.id;


--
-- Name: sensor_readings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sensor_readings (
    id bigint NOT NULL,
    product_id text NOT NULL,
    domain text,
    sensor_type text DEFAULT 'env'::text NOT NULL,
    temperature double precision,
    humidity double precision,
    source text DEFAULT 'system'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sensor_readings OWNER TO postgres;

--
-- Name: sensor_readings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sensor_readings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sensor_readings_id_seq OWNER TO postgres;

--
-- Name: sensor_readings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sensor_readings_id_seq OWNED BY public.sensor_readings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    organization_id text,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'producer'::text NOT NULL,
    oauth_provider text,
    oauth_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['super_admin'::text, 'org_admin'::text, 'producer'::text, 'distributor'::text, 'retailer'::text, 'inspector'::text, 'consumer'::text, 'auditor'::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: warehouse_iot_companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse_iot_companies (
    company_id text NOT NULL,
    warehouse_count integer DEFAULT 0 NOT NULL,
    total_capacity_cubic_m double precision,
    cold_storage_supported boolean DEFAULT false NOT NULL,
    automation_level text,
    iot_platform text,
    sensor_types jsonb DEFAULT '[]'::jsonb NOT NULL,
    robotics_enabled boolean DEFAULT false NOT NULL,
    predictive_maintenance_enabled boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.warehouse_iot_companies OWNER TO postgres;

--
-- Name: warehouse_layouts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse_layouts (
    id text NOT NULL,
    company_id text NOT NULL,
    warehouse_code text NOT NULL,
    warehouse_name text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    dimensions jsonb DEFAULT '{}'::jsonb NOT NULL,
    rack_model jsonb DEFAULT '[]'::jsonb NOT NULL,
    sensor_nodes jsonb DEFAULT '[]'::jsonb NOT NULL,
    equipment_nodes jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.warehouse_layouts OWNER TO postgres;

--
-- Name: ai_anomaly_insights id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_anomaly_insights ALTER COLUMN id SET DEFAULT nextval('public.ai_anomaly_insights_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: notification_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_events ALTER COLUMN id SET DEFAULT nextval('public.notification_events_id_seq'::regclass);


--
-- Name: product_lineage_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_lineage_events ALTER COLUMN id SET DEFAULT nextval('public.product_lineage_events_id_seq'::regclass);


--
-- Name: qr_verification_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_verification_logs ALTER COLUMN id SET DEFAULT nextval('public.qr_verification_logs_id_seq'::regclass);


--
-- Name: sensor_readings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_readings ALTER COLUMN id SET DEFAULT nextval('public.sensor_readings_id_seq'::regclass);


--
-- Data for Name: agriculture_companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agriculture_companies (company_id, farm_count, total_farm_area_hectares, primary_crops, soil_profile, irrigation_methods, pesticide_policy, organic_certifications, weather_station_enabled, updated_at) FROM stdin;
\.


--
-- Data for Name: ai_anomaly_insights; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_anomaly_insights (id, product_id, checkpoint_id, company_id, domain, anomaly_type, severity, score, title, description, suggested_action, model_version, status, detected_at, resolved_at, metadata) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, actor_id, action, resource_type, resource_id, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: checkpoints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.checkpoints (id, product_id, checkpoint_type, location, latitude, longitude, notes, temperature, humidity, shock, iot_payload, image_urls, data_hash, blockchain_tx_hash, added_by, verified, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, company_code, domain, company_name, legal_name, registration_number, tax_id, contact_email, contact_phone, website, country, state, city, address_line1, postal_code, status, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ecommerce_companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ecommerce_companies (company_id, marketplace_type, seller_verification_level, anti_counterfeit_program, warranty_supported, return_window_days, fulfillment_model, supported_regions, avg_authenticity_score, updated_at) FROM stdin;
\.


--
-- Data for Name: food_safety_companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.food_safety_companies (company_id, fssai_license_no, iso_22000_certified, haccp_certified, allergen_program, contamination_test_lab, recall_sop_version, avg_processing_tons_per_day, nutrition_label_standard, updated_at) FROM stdin;
\.


--
-- Data for Name: inventory_stock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_stock (id, company_id, warehouse_layout_id, product_id, sku, rack_row_bin, lot_number, serial_number, quantity, reorder_point, max_capacity, status, last_movement_at, expiry_date, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: iot_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.iot_devices (id, company_id, domain, device_code, device_name, mqtt_client_id, mqtt_topic, sensor_type, status, last_seen_at, firmware_version, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_events (id, channel, event_type, domain, company_id, product_id, checkpoint_id, severity, recipient_id, recipient_address, title, message, payload, delivery_status, sent_at, delivered_at, acknowledged_at, created_at) FROM stdin;
\.


--
-- Data for Name: pharmaceutical_companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pharmaceutical_companies (company_id, manufacturing_license_no, gmp_certified, fda_registration_no, cold_chain_supported, storage_temp_min_c, storage_temp_max_c, active_ingredient_catalog, adverse_event_contact, pharmacovigilance_program, updated_at) FROM stdin;
\.


--
-- Data for Name: product_lineage_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_lineage_events (id, source_product_id, target_product_id, transformation_type, quantity_in, quantity_out, unit, event_location, performed_by, process_metadata, blockchain_tx_hash, created_at) FROM stdin;
\.


--
-- Data for Name: product_recalls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_recalls (id, recall_code, product_id, company_id, reason, severity, status, initiated_by, initiated_at, resolved_at, impacted_batches, corrective_actions, metadata) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, product_id, domain, product_name, category, description, batch_number, serial_number, quantity, unit, origin_location, organization_id, metadata, certifications, ipfs_hash, blockchain_tx_hash, authenticity_score, status, created_by, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: qr_verification_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.qr_verification_logs (id, product_id, verification_token, source_channel, status, trust_score, consumer_wallet, device_fingerprint, ip_address, geo, created_at) FROM stdin;
\.


--
-- Data for Name: sensor_readings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sensor_readings (id, product_id, domain, sensor_type, temperature, humidity, source, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, organization_id, name, email, password_hash, role, oauth_provider, oauth_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: warehouse_iot_companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouse_iot_companies (company_id, warehouse_count, total_capacity_cubic_m, cold_storage_supported, automation_level, iot_platform, sensor_types, robotics_enabled, predictive_maintenance_enabled, updated_at) FROM stdin;
\.


--
-- Data for Name: warehouse_layouts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouse_layouts (id, company_id, warehouse_code, warehouse_name, version, dimensions, rack_model, sensor_nodes, equipment_nodes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Name: ai_anomaly_insights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ai_anomaly_insights_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: notification_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_events_id_seq', 1, false);


--
-- Name: product_lineage_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_lineage_events_id_seq', 1, false);


--
-- Name: qr_verification_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.qr_verification_logs_id_seq', 1, false);


--
-- Name: sensor_readings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sensor_readings_id_seq', 1, false);


--
-- Name: agriculture_companies agriculture_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agriculture_companies
    ADD CONSTRAINT agriculture_companies_pkey PRIMARY KEY (company_id);


--
-- Name: ai_anomaly_insights ai_anomaly_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_anomaly_insights
    ADD CONSTRAINT ai_anomaly_insights_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: checkpoints checkpoints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkpoints
    ADD CONSTRAINT checkpoints_pkey PRIMARY KEY (id);


--
-- Name: companies companies_company_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_company_code_key UNIQUE (company_code);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: ecommerce_companies ecommerce_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecommerce_companies
    ADD CONSTRAINT ecommerce_companies_pkey PRIMARY KEY (company_id);


--
-- Name: food_safety_companies food_safety_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.food_safety_companies
    ADD CONSTRAINT food_safety_companies_pkey PRIMARY KEY (company_id);


--
-- Name: inventory_stock inventory_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_stock
    ADD CONSTRAINT inventory_stock_pkey PRIMARY KEY (id);


--
-- Name: iot_devices iot_devices_device_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.iot_devices
    ADD CONSTRAINT iot_devices_device_code_key UNIQUE (device_code);


--
-- Name: iot_devices iot_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.iot_devices
    ADD CONSTRAINT iot_devices_pkey PRIMARY KEY (id);


--
-- Name: notification_events notification_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_events
    ADD CONSTRAINT notification_events_pkey PRIMARY KEY (id);


--
-- Name: pharmaceutical_companies pharmaceutical_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmaceutical_companies
    ADD CONSTRAINT pharmaceutical_companies_pkey PRIMARY KEY (company_id);


--
-- Name: product_lineage_events product_lineage_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_lineage_events
    ADD CONSTRAINT product_lineage_events_pkey PRIMARY KEY (id);


--
-- Name: product_recalls product_recalls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_recalls
    ADD CONSTRAINT product_recalls_pkey PRIMARY KEY (id);


--
-- Name: product_recalls product_recalls_recall_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_recalls
    ADD CONSTRAINT product_recalls_recall_code_key UNIQUE (recall_code);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_product_id_key UNIQUE (product_id);


--
-- Name: qr_verification_logs qr_verification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_verification_logs
    ADD CONSTRAINT qr_verification_logs_pkey PRIMARY KEY (id);


--
-- Name: sensor_readings sensor_readings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_readings
    ADD CONSTRAINT sensor_readings_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: warehouse_iot_companies warehouse_iot_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_iot_companies
    ADD CONSTRAINT warehouse_iot_companies_pkey PRIMARY KEY (company_id);


--
-- Name: warehouse_layouts warehouse_layouts_company_id_warehouse_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_layouts
    ADD CONSTRAINT warehouse_layouts_company_id_warehouse_code_key UNIQUE (company_id, warehouse_code);


--
-- Name: warehouse_layouts warehouse_layouts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_layouts
    ADD CONSTRAINT warehouse_layouts_pkey PRIMARY KEY (id);


--
-- Name: idx_ai_anomaly_product_detected; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_anomaly_product_detected ON public.ai_anomaly_insights USING btree (product_id, detected_at DESC);


--
-- Name: idx_ai_anomaly_status_severity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_anomaly_status_severity ON public.ai_anomaly_insights USING btree (status, severity, detected_at DESC);


--
-- Name: idx_checkpoints_product_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_checkpoints_product_created ON public.checkpoints USING btree (product_id, created_at DESC);


--
-- Name: idx_checkpoints_type_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_checkpoints_type_created ON public.checkpoints USING btree (checkpoint_type, created_at DESC);


--
-- Name: idx_companies_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_companies_code ON public.companies USING btree (company_code);


--
-- Name: idx_companies_domain_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_companies_domain_created ON public.companies USING btree (domain, created_at DESC);


--
-- Name: idx_inventory_stock_company_warehouse; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_stock_company_warehouse ON public.inventory_stock USING btree (company_id, warehouse_layout_id, status);


--
-- Name: idx_inventory_stock_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_stock_product ON public.inventory_stock USING btree (product_id, updated_at DESC);


--
-- Name: idx_iot_devices_company_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_iot_devices_company_status ON public.iot_devices USING btree (company_id, status, last_seen_at DESC);


--
-- Name: idx_iot_devices_mqtt_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_iot_devices_mqtt_client ON public.iot_devices USING btree (mqtt_client_id);


--
-- Name: idx_lineage_source_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lineage_source_created ON public.product_lineage_events USING btree (source_product_id, created_at DESC);


--
-- Name: idx_lineage_target_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lineage_target_created ON public.product_lineage_events USING btree (target_product_id, created_at DESC);


--
-- Name: idx_notification_company_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_company_created ON public.notification_events USING btree (company_id, created_at DESC);


--
-- Name: idx_notification_recipient_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_recipient_status ON public.notification_events USING btree (recipient_id, delivery_status, created_at DESC);


--
-- Name: idx_product_recalls_product_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_recalls_product_status ON public.product_recalls USING btree (product_id, status, initiated_at DESC);


--
-- Name: idx_products_batch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_batch ON public.products USING btree (batch_number);


--
-- Name: idx_products_domain_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_domain_created ON public.products USING btree (domain, created_at DESC);


--
-- Name: idx_products_org_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_org_created ON public.products USING btree (organization_id, created_at DESC);


--
-- Name: idx_qr_logs_product_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_logs_product_created ON public.qr_verification_logs USING btree (product_id, created_at DESC);


--
-- Name: idx_qr_logs_status_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qr_logs_status_created ON public.qr_verification_logs USING btree (status, created_at DESC);


--
-- Name: idx_sensor_readings_product_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sensor_readings_product_created ON public.sensor_readings USING btree (product_id, created_at DESC);


--
-- Name: idx_users_org_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_org_created ON public.users USING btree (organization_id, created_at DESC);


--
-- Name: idx_warehouse_layouts_company_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_warehouse_layouts_company_active ON public.warehouse_layouts USING btree (company_id, is_active, updated_at DESC);


--
-- Name: agriculture_companies agriculture_companies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agriculture_companies
    ADD CONSTRAINT agriculture_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: ai_anomaly_insights ai_anomaly_insights_checkpoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_anomaly_insights
    ADD CONSTRAINT ai_anomaly_insights_checkpoint_id_fkey FOREIGN KEY (checkpoint_id) REFERENCES public.checkpoints(id) ON DELETE SET NULL;


--
-- Name: ai_anomaly_insights ai_anomaly_insights_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_anomaly_insights
    ADD CONSTRAINT ai_anomaly_insights_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: ai_anomaly_insights ai_anomaly_insights_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_anomaly_insights
    ADD CONSTRAINT ai_anomaly_insights_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE SET NULL;


--
-- Name: checkpoints checkpoints_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkpoints
    ADD CONSTRAINT checkpoints_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;


--
-- Name: ecommerce_companies ecommerce_companies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ecommerce_companies
    ADD CONSTRAINT ecommerce_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: food_safety_companies food_safety_companies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.food_safety_companies
    ADD CONSTRAINT food_safety_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: inventory_stock inventory_stock_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_stock
    ADD CONSTRAINT inventory_stock_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: inventory_stock inventory_stock_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_stock
    ADD CONSTRAINT inventory_stock_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE SET NULL;


--
-- Name: inventory_stock inventory_stock_warehouse_layout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_stock
    ADD CONSTRAINT inventory_stock_warehouse_layout_id_fkey FOREIGN KEY (warehouse_layout_id) REFERENCES public.warehouse_layouts(id) ON DELETE SET NULL;


--
-- Name: iot_devices iot_devices_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.iot_devices
    ADD CONSTRAINT iot_devices_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: notification_events notification_events_checkpoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_events
    ADD CONSTRAINT notification_events_checkpoint_id_fkey FOREIGN KEY (checkpoint_id) REFERENCES public.checkpoints(id) ON DELETE SET NULL;


--
-- Name: notification_events notification_events_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_events
    ADD CONSTRAINT notification_events_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: notification_events notification_events_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_events
    ADD CONSTRAINT notification_events_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE SET NULL;


--
-- Name: pharmaceutical_companies pharmaceutical_companies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmaceutical_companies
    ADD CONSTRAINT pharmaceutical_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: product_lineage_events product_lineage_events_source_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_lineage_events
    ADD CONSTRAINT product_lineage_events_source_product_id_fkey FOREIGN KEY (source_product_id) REFERENCES public.products(product_id) ON DELETE SET NULL;


--
-- Name: product_lineage_events product_lineage_events_target_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_lineage_events
    ADD CONSTRAINT product_lineage_events_target_product_id_fkey FOREIGN KEY (target_product_id) REFERENCES public.products(product_id) ON DELETE SET NULL;


--
-- Name: product_recalls product_recalls_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_recalls
    ADD CONSTRAINT product_recalls_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: product_recalls product_recalls_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_recalls
    ADD CONSTRAINT product_recalls_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE SET NULL;


--
-- Name: qr_verification_logs qr_verification_logs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_verification_logs
    ADD CONSTRAINT qr_verification_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE SET NULL;


--
-- Name: warehouse_iot_companies warehouse_iot_companies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_iot_companies
    ADD CONSTRAINT warehouse_iot_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: warehouse_layouts warehouse_layouts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_layouts
    ADD CONSTRAINT warehouse_layouts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 5HCurhBWwmprBvBPLmWNjQmkT7i96dZcSSBjb6mPyjEZc6XTZVsmLviqCHsj3QW

