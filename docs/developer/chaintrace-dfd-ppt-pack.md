# ChainTrace DFD Pack (PPT-Style, Sample-Matching)

## 1. Scope
- Deliverable type: PPT-ready text (manual drawing guide), not Mermaid/image rendering.
- Diagram set:
  - 1 Context Diagram
  - 7 Level-1 Diagrams:
    - Super Admin
    - Producer
    - Distributor
    - Retailer
    - Inspector
    - Consumer
    - Auditor
- Process depth: 5 role processes per Level-1 diagram, plus login node style.
- Datastore mode:
  - Context: grouped stores
  - Level-1: exact table names from core 11 tables

## 2. Drawing Legend (Match Sample Style)
- `External Entity` -> rectangle
- `Process` -> circle (with process number inside)
- `Data Store` -> open-ended rectangle/data store box
- `Data Flow` -> arrowed line with uppercase label
- Left side pattern for each Level-1:
  - Data store box: `Login`
  - Process circle: `Login <n>.0`
  - Flow labels between Login store and Login process: `LOGIN_ID`, `RESPONSE`
- Middle: role process circles (`n.1` to `n.5`)
- Right side: data stores (exact table names)

## 3. CONTEXT DIAGRAM
### Header
- `CONTEXT DIAGRAM`

### Central Process
- `ChainTrace 0`

### External Entities
- `Super Admin`
- `Producer`
- `Distributor`
- `Retailer`
- `Inspector`
- `Consumer`
- `Auditor`
- `Blockchain Network (Ganache + Smart Contract)`
- `IoT Devices / MQTT Source`

### Grouped Data Stores (Context Level)
- `D1 Auth & Access Store` (`users`)
- `D2 Master Data Store` (`companies`, domain profile tables, `products`)
- `D3 Trace Events Store` (`checkpoints`)
- `D4 Monitoring & Audit Store` (`sensor_readings`, `audit_logs`)

### Main Flow List (Draw These Arrows)
- `Super Admin -> ChainTrace 0 : REQUEST`
- `ChainTrace 0 -> Super Admin : RESPONSE`
- `Producer -> ChainTrace 0 : REQUEST`
- `ChainTrace 0 -> Producer : RESPONSE`
- `Distributor -> ChainTrace 0 : REQUEST`
- `ChainTrace 0 -> Distributor : RESPONSE`
- `Retailer -> ChainTrace 0 : REQUEST`
- `ChainTrace 0 -> Retailer : RESPONSE`
- `Inspector -> ChainTrace 0 : REQUEST`
- `ChainTrace 0 -> Inspector : RESPONSE`
- `Consumer -> ChainTrace 0 : REQUEST`
- `ChainTrace 0 -> Consumer : RESPONSE`
- `Auditor -> ChainTrace 0 : REQUEST`
- `ChainTrace 0 -> Auditor : RESPONSE`
- `ChainTrace 0 -> Blockchain Network : TX_REQUEST`
- `Blockchain Network -> ChainTrace 0 : TX_HASH`
- `IoT Devices/MQTT Source -> ChainTrace 0 : SENSOR_STREAM`
- `ChainTrace 0 -> D1 Auth & Access Store : SELECT/WRITE`
- `D1 Auth & Access Store -> ChainTrace 0 : RESPONSE`
- `ChainTrace 0 -> D2 Master Data Store : SELECT/WRITE`
- `D2 Master Data Store -> ChainTrace 0 : RESPONSE`
- `ChainTrace 0 -> D3 Trace Events Store : SELECT/WRITE`
- `D3 Trace Events Store -> ChainTrace 0 : RESPONSE`
- `ChainTrace 0 -> D4 Monitoring & Audit Store : SELECT/WRITE`
- `D4 Monitoring & Audit Store -> ChainTrace 0 : RESPONSE`

---

## 4. LEVEL 1 SUPER ADMIN
### Header
- `LEVEL 1 SUPER ADMIN`

### Login Node
- Login store box: `Login`
- Login process circle: `Login 1.0`
- Flow labels: `LOGIN_ID`, `RESPONSE`, `SELECT`

### Process Mapping
| Process ID | Process Name | Data Store(s) | Key Flow Labels |
|---|---|---|---|
| `1.1` | Manage Users & Roles | `users` | `USER_ID`, `SELECT`, `RESPONSE` |
| `1.2` | Manage Companies | `companies` | `COMPANY_ID`, `SELECT`, `RESPONSE` |
| `1.3` | Configure Domain Profiles | `agriculture_companies`, `pharmaceutical_companies`, `food_safety_companies`, `ecommerce_companies`, `warehouse_iot_companies` | `COMPANY_ID`, `SELECT`, `RESPONSE` |
| `1.4` | Review Platform Traceability | `products`, `checkpoints` | `PRODUCT_ID`, `CHECKPOINT_ID`, `RESPONSE` |
| `1.5` | Review Audit & Sensor Evidence | `audit_logs`, `sensor_readings` | `AUDIT_ID`, `SENSOR_READING_ID`, `RESPONSE` |

---

## 5. LEVEL 1 PRODUCER
### Header
- `LEVEL 1 PRODUCER`

### Login Node
- Login store: `Login`
- Login process: `Login 2.0`
- Flow labels: `LOGIN_ID`, `RESPONSE`, `SELECT`

### Process Mapping
| Process ID | Process Name | Data Store(s) | Key Flow Labels |
|---|---|---|---|
| `2.1` | Register Product | `products` | `PRODUCT_ID`, `REQUEST`, `RESPONSE` |
| `2.2` | Update Product Metadata | `products` | `PRODUCT_ID`, `SELECT`, `RESPONSE` |
| `2.3` | Add Origin/Processing Checkpoint | `checkpoints` | `CHECKPOINT_ID`, `REQUEST`, `RESPONSE` |
| `2.4` | Track Product Journey | `products`, `checkpoints` | `PRODUCT_ID`, `SELECT`, `RESPONSE` |
| `2.5` | Monitor Batch Conditions | `sensor_readings`, `audit_logs` | `SENSOR_READING_ID`, `AUDIT_ID`, `RESPONSE` |

---

## 6. LEVEL 1 DISTRIBUTOR
### Header
- `LEVEL 1 DISTRIBUTOR`

### Login Node
- Login store: `Login`
- Login process: `Login 3.0`
- Flow labels: `LOGIN_ID`, `RESPONSE`, `SELECT`

### Process Mapping
| Process ID | Process Name | Data Store(s) | Key Flow Labels |
|---|---|---|---|
| `3.1` | Receive Shipment Checkpoint | `checkpoints` | `CHECKPOINT_ID`, `REQUEST`, `RESPONSE` |
| `3.2` | In-Transit Update | `checkpoints` | `CHECKPOINT_ID`, `REQUEST`, `RESPONSE` |
| `3.3` | Dispatch Checkpoint | `checkpoints` | `CHECKPOINT_ID`, `REQUEST`, `RESPONSE` |
| `3.4` | Capture Transport Telemetry | `sensor_readings` | `SENSOR_READING_ID`, `REQUEST`, `RESPONSE` |
| `3.5` | View Shipment History | `products`, `checkpoints`, `audit_logs` | `PRODUCT_ID`, `CHECKPOINT_ID`, `AUDIT_ID`, `RESPONSE` |

---

## 7. LEVEL 1 RETAILER
### Header
- `LEVEL 1 RETAILER`

### Login Node
- Login store: `Login`
- Login process: `Login 4.0`
- Flow labels: `LOGIN_ID`, `RESPONSE`, `SELECT`

### Process Mapping
| Process ID | Process Name | Data Store(s) | Key Flow Labels |
|---|---|---|---|
| `4.1` | Receive Inventory | `checkpoints` | `CHECKPOINT_ID`, `REQUEST`, `RESPONSE` |
| `4.2` | Update Retail Stock Status | `products` | `PRODUCT_ID`, `SELECT`, `RESPONSE` |
| `4.3` | Final Delivery/Sale Checkpoint | `checkpoints` | `CHECKPOINT_ID`, `REQUEST`, `RESPONSE` |
| `4.4` | Resolve Verification Query | `products`, `checkpoints` | `VERIFY_REQUEST`, `VERIFY_RESPONSE`, `PRODUCT_ID` |
| `4.5` | View Product/Batch History | `products`, `audit_logs` | `PRODUCT_ID`, `AUDIT_ID`, `RESPONSE` |

---

## 8. LEVEL 1 INSPECTOR
### Header
- `LEVEL 1 INSPECTOR`

### Login Node
- Login store: `Login`
- Login process: `Login 5.0`
- Flow labels: `LOGIN_ID`, `RESPONSE`, `SELECT`

### Process Mapping
| Process ID | Process Name | Data Store(s) | Key Flow Labels |
|---|---|---|---|
| `5.1` | Execute Quality Check | `checkpoints` | `CHECKPOINT_ID`, `REQUEST`, `RESPONSE` |
| `5.2` | Record Compliance Observation | `audit_logs` | `AUDIT_ID`, `REQUEST`, `RESPONSE` |
| `5.3` | Validate Storage Conditions | `sensor_readings` | `SENSOR_READING_ID`, `SELECT`, `RESPONSE` |
| `5.4` | Verify Product Integrity | `products`, `checkpoints` | `PRODUCT_ID`, `CHECKPOINT_ID`, `RESPONSE` |
| `5.5` | Publish Inspection Outcome | `audit_logs`, `products` | `AUDIT_ID`, `PRODUCT_ID`, `RESPONSE` |

---

## 9. LEVEL 1 CONSUMER
### Header
- `LEVEL 1 CONSUMER`

### Login Node
- Login store: `Login` (or Guest Access block if no login is drawn)
- Login process: `Login 6.0`
- Flow labels: `LOGIN_ID`, `RESPONSE`, `SELECT`

### Process Mapping
| Process ID | Process Name | Data Store(s) | Key Flow Labels |
|---|---|---|---|
| `6.1` | Verify by Product ID / QR | `products` | `VERIFY_REQUEST`, `PRODUCT_ID`, `VERIFY_RESPONSE` |
| `6.2` | View Journey Timeline | `checkpoints` | `PRODUCT_ID`, `CHECKPOINT_ID`, `RESPONSE` |
| `6.3` | View Trust Status | `products`, `sensor_readings` | `PRODUCT_ID`, `SENSOR_READING_ID`, `RESPONSE` |
| `6.4` | Report Suspicious Product | `audit_logs` | `AUDIT_ID`, `REQUEST`, `RESPONSE` |
| `6.5` | Retrieve Verification Response | `products`, `checkpoints` | `VERIFY_RESPONSE`, `PRODUCT_ID`, `CHECKPOINT_ID` |

---

## 10. LEVEL 1 AUDITOR
### Header
- `LEVEL 1 AUDITOR`

### Login Node
- Login store: `Login`
- Login process: `Login 7.0`
- Flow labels: `LOGIN_ID`, `RESPONSE`, `SELECT`

### Process Mapping
| Process ID | Process Name | Data Store(s) | Key Flow Labels |
|---|---|---|---|
| `7.1` | Query Product Trail | `products` | `PRODUCT_ID`, `SELECT`, `RESPONSE` |
| `7.2` | Query Checkpoint Events | `checkpoints` | `CHECKPOINT_ID`, `SELECT`, `RESPONSE` |
| `7.3` | Review User Activity | `users`, `audit_logs` | `USER_ID`, `AUDIT_ID`, `RESPONSE` |
| `7.4` | Review Sensor Compliance | `sensor_readings` | `SENSOR_READING_ID`, `SELECT`, `RESPONSE` |
| `7.5` | Export Audit Summary | `products`, `checkpoints`, `audit_logs` | `PRODUCT_ID`, `CHECKPOINT_ID`, `AUDIT_ID`, `RESPONSE` |

---

## 11. Data Label Dictionary (Arrow Text)
- Identity labels:
  - `LOGIN_ID`
  - `USER_ID`
  - `COMPANY_ID`
  - `PRODUCT_ID`
  - `CHECKPOINT_ID`
  - `SENSOR_READING_ID`
  - `AUDIT_ID`
- Action/communication labels:
  - `REQUEST`
  - `RESPONSE`
  - `SELECT`
- Blockchain labels:
  - `TX_REQUEST`
  - `TX_HASH`
- Verification labels:
  - `VERIFY_REQUEST`
  - `VERIFY_RESPONSE`

## 12. Validation Checklist (Before Final PPT Export)
1. Role coverage:
   - Exactly 7 Level-1 role diagrams present (Org Admin excluded).
2. Process count:
   - Each Level-1 has exactly 5 role processes plus login node.
3. Datastore style:
   - Context uses grouped stores only.
   - Level-1 uses exact table names only.
4. Flow completeness:
   - Every process has at least one inbound request/select and one outbound response/store interaction.
5. Schema consistency:
   - All Level-1 table names exist in `backend/src/config/postgres.ts`.
6. Slide readability:
   - One diagram per slide and text readable in classroom projection.

## 13. Assumptions and Defaults
- Output is PPT-ready textual spec; drawing is manual in PowerPoint.
- Admin coverage is Super Admin only.
- Numbering scheme is fixed:
  - Super Admin (`1.0`-`1.5`)
  - Producer (`2.0`-`2.5`)
  - Distributor (`3.0`-`3.5`)
  - Retailer (`4.0`-`4.5`)
  - Inspector (`5.0`-`5.5`)
  - Consumer (`6.0`-`6.5`)
  - Auditor (`7.0`-`7.5`)
- Source of truth for table names: `backend/src/config/postgres.ts`.
