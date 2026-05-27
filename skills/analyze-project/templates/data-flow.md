# Data Flow & Tech Stack Analysis

> Project: <!-- FILL: project name -->
> Generated: <!-- FILL: date -->

## Tech Stack Inventory

### Runtime & Languages

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | <!-- FILL --> | <!-- FILL --> |
| Runtime | <!-- FILL --> | <!-- FILL --> |
| Framework | <!-- FILL --> | <!-- FILL --> |

### Data Storage

| Store | Technology | Purpose |
|-------|-----------|---------|
| <!-- FILL --> | <!-- FILL --> | <!-- FILL: primary DB, cache, search, queue --> |

### Infrastructure

| Component | Technology |
|-----------|-----------|
| Web server | <!-- FILL --> |
| Reverse proxy | <!-- FILL --> |
| Message queue | <!-- FILL --> |
| Cache layer | <!-- FILL --> |
| File storage | <!-- FILL --> |
| Monitoring | <!-- FILL --> |

## Data Movement

### Request Lifecycle

<!-- FILL: Trace a request from entry to response.
Describe what touches the data at each step.
-->

```
Client → [Load Balancer] → [Web Server] → [Middleware] → [Handler] → [Service] → [DB]
                                                                       ↓
                                                                    [Cache]
```

### Data Pipelines

<!-- FILL: Any background data processing:
- ETL jobs
- Queue workers
- Scheduled tasks
- Event processing
- Stream processing
-->

| Pipeline | Trigger | Input | Processing | Output |
|----------|---------|-------|------------|--------|
| <!-- FILL --> | <!-- FILL --> | <!-- FILL --> | <!-- FILL --> | <!-- FILL --> |

### External Integrations

| Service | Direction | Protocol | Purpose |
|---------|----------|----------|---------|
| <!-- FILL --> | inbound/outbound | <!-- FILL --> | <!-- FILL --> |

## Data Lifecycle

<!-- FILL: How data is created, transformed, stored, and eventually deleted.
Cover: ingestion → validation → processing → storage → retrieval → archival/deletion
-->

## Caching Strategy

| Cache Layer | Technology | TTL | Invalidation |
|------------|-----------|-----|-------------|
| <!-- FILL --> | <!-- FILL --> | <!-- FILL --> | <!-- FILL --> |

## Recommendations

1. <!-- FILL -->
2. <!-- FILL -->
