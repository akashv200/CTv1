# ChainTrace Presentation Script

## Overview
- Presentation type: short academic project presentation
- Deck alignment: `docs/developer/simple-powerpoint-chaintrace.md`
- Suggested duration: 7 to 10 minutes
- Speaking style: clear, steady, and practical

## Opening
Good morning everyone. Today I am presenting our project, **ChainTrace**, which is a multi-domain blockchain-based supply chain traceability platform. The goal of this project is to improve transparency, product authenticity, and real-time tracking across different industries using blockchain, IoT, analytics, and a web-based dashboard.

## Slide 1 - Abstract
This project is called ChainTrace. It is designed as a unified platform for tracking products across agriculture, pharmaceutical, food safety, e-commerce authenticity, and warehouse IoT management. The main idea is to record every important product event in a way that is transparent, traceable, and difficult to tamper with. For academic testing, we use Ganache with Hardhat instead of a public blockchain, so the system can be tested repeatedly without real gas fees.

## Slide 2 - Introduction
In real-world supply chains, product information is often distributed across many different parties such as producers, transporters, warehouses, retailers, and consumers. Because of this, it becomes difficult to verify where a product came from, whether it was handled correctly, and whether the data can be trusted. ChainTrace solves this by creating one digital platform where product registration, checkpoint tracking, consumer verification, and analytics work together in one system.

## Slide 3 - Existing System
In the existing system, most supply chain data is stored in separate databases, spreadsheets, or manual documents. These systems are usually centralized and organization-specific. That means there is no common trusted record across the full supply chain. As a result, traceability is weak, verification is slow, and consumers or auditors cannot easily confirm product authenticity.

## Slide 4 - Drawbacks of Existing System
The current approach has several drawbacks. First, records can be modified, which creates trust issues. Second, recall management is slow because companies need to manually trace product history. Third, monitoring of storage conditions like temperature and humidity is often incomplete. Finally, counterfeit products and supply chain fraud become harder to detect because there is no reliable end-to-end visibility.

## Slide 5 - Proposed System
To address these problems, we propose ChainTrace. In this system, products are registered with domain-specific details and supporting certificates. Every important movement or quality event is stored as a checkpoint. Blockchain transaction hashes are associated with those records to provide tamper-evident proof. Consumers can verify a product using QR or product ID, and organizations can view dashboards with analytics, maps, AI insights, and 3D warehouse visualization.

## Slide 6 - Advantages
The main advantages of ChainTrace are improved transparency, stronger trust, better recall readiness, and better monitoring of operational quality. Since the platform is multi-domain, the same core architecture can support different industries without building completely separate systems. It is also scalable because it uses PostgreSQL, real-time APIs, and modular frontend and backend layers.

## Slide 7 - Modules and User Roles
This project supports multiple user roles. The super admin manages the platform globally. The organization admin manages users and operations inside one organization. Producers register products and upload source data. Distributors update shipment checkpoints. Retailers handle final inventory and delivery stages. Inspectors record quality and compliance checks. Auditors review traceability in read-only mode. Consumers verify authenticity publicly through the verification portal.

## Slide 8 - Frontend and Backend Stacks
On the frontend side, we use React with TypeScript, Tailwind CSS, Zustand, Recharts, Three.js, Mapbox GL, and Framer Motion. On the backend side, we use Node.js, Express, REST APIs, GraphQL through Apollo, Socket.io for real-time updates, JWT authentication, and Zod validation. PostgreSQL is used as the primary database, Redis supports real-time and caching needs, MQTT is used for IoT simulation, and Solidity with Hardhat and Ganache is used for blockchain integration.

## Slide 9 - Minimum Hardware and Software Requirements
To run this project smoothly, the minimum hardware includes an Intel i5 or equivalent processor, at least 8 GB RAM, and about 20 GB of free storage. On the software side, the system requires Node.js, npm, PostgreSQL, Redis, Ganache, and optionally an MQTT broker like Mosquitto. A modern browser such as Chrome or Edge is also required for wallet integration and frontend rendering.

## Slide 10 - DFD
This data flow diagram shows the overall movement of information in ChainTrace. Users interact with the React frontend, which sends requests to the backend API layer. The backend handles authentication, validation, and business logic. It communicates with PostgreSQL for core data, Redis for real-time support, MQTT for sensor events, and Ganache-based blockchain contracts for transaction proof. The verification portal also uses this same flow to fetch product history and trust status.

## Slide 11 - Tables
This slide summarizes the core database structure. The `companies` table stores organization details. Domain-specific company tables store extra data for agriculture, pharma, food safety, e-commerce, and warehouse operations. The `users` table manages roles and access. The `products` table stores product master records. The `checkpoints` table stores journey events. `audit_logs` stores system activity history, and `sensor_readings` stores IoT telemetry such as temperature and humidity. Together, these tables form the operational backbone of the platform.

## Slide 12 - Conclusion
In conclusion, ChainTrace is a practical and scalable supply chain traceability platform that combines blockchain, IoT, and analytics into one unified system. It addresses major issues such as fragmented tracking, weak trust, slow recalls, and limited verification. The current implementation already provides a strong academic prototype, and in the future it can be extended with more advanced AI, stronger blockchain execution, and enterprise-level integrations.

## Closing Line
Thank you. This was our project, ChainTrace. I am ready to answer any questions.

## Possible Viva Questions
- Why did you choose Ganache instead of Polygon?
- Why is PostgreSQL used as the main database?
- How does blockchain improve traceability here?
- What is the purpose of MQTT and Redis in this system?
- How can this project be extended in real-world deployment?

## Short Answers for Viva
- Ganache was chosen because it supports repeated local testing without real gas fees.
- PostgreSQL was chosen because the data is relational, structured, and better suited for querying and reporting.
- Blockchain provides tamper-evident transaction proof for important supply chain events.
- MQTT simulates IoT device communication, while Redis supports fast real-time handling.
- In production, the project can be extended with real blockchain writes, IPFS, stronger AI, and ERP integrations.
