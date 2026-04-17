# Database Design (MongoDB + PostgreSQL)

## Collections

## `users`

- `name`
- `email` (unique)
- `passwordHash`
- `role`
- `organizationId`
- `oauthProvider`, `oauthId`
- timestamps

## `products`

- `productId` (unique)
- `domain`
- `productName`
- `batchNumber`
- `quantity`, `unit`
- `originLocation`
- `metadata` (domain-specific key/value object)
- `certifications[]`
- `blockchainTxHash`
- `authenticityScore`
- `status`
- `organizationId`
- timestamps

## `checkpoints`

- `productId` (indexed)
- `checkpointType`
- `location`
- `temperature`, `humidity`, `shock`
- `iotPayload`
- `dataHash`
- `blockchainTxHash`
- `addedBy`
- `verified`
- timestamps

## `auditlogs`

- `actorId`
- `action`
- `resourceType`
- `resourceId`
- `metadata`
- timestamps

## PostgreSQL Table: `sensor_readings`

- `id` (bigserial primary key)
- `product_id` (text, indexed)
- `domain` (text)
- `sensor_type` (text, default `env`)
- `temperature` (double precision, nullable)
- `humidity` (double precision, nullable)
- `source` (text, e.g. `mqtt`, `checkpoint`)
- `created_at` (timestamptz, default now)

## Index Plan

- `users.email` unique
- `products.productId` unique
- `products.batchNumber` index
- `checkpoints.productId` index
- compound candidate: `checkpoints.productId + createdAt`
- `sensor_readings(product_id, created_at DESC)` index
