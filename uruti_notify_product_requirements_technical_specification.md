# UrutiNotify – Full Product Requirements & Technical Specification

---

## 1. Product Requirements Document (PRD)

### 1.1 Product Overview
**UrutiNotify** is a multi-tenant, event-driven, omni-channel notification orchestration platform designed to deliver reliable, compliant, and scalable notifications across multiple communication channels. It serves as a shared infrastructure component for **UrutiWorkflow (Camunda-based)** and all Uruti platforms (GovTech, FinTech, ERP, Gaming, Telco).

### 1.2 Problem Statement
Organizations struggle with:
- Fragmented notification logic embedded in applications
- Vendor lock-in (SMS, Email, WhatsApp providers)
- Lack of delivery guarantees and auditability
- Poor template governance and localization
- No unified analytics across channels

UrutiNotify solves this by centralizing notification intent, orchestration, delivery, and observability.

### 1.3 Goals & Objectives
- Centralize all notification delivery
- Support multiple channels and providers
- Ensure delivery guarantees and audit trails
- Enable multi-tenancy and white-labeling
- Integrate natively with workflow engines

### 1.4 In-Scope Features

#### Core Capabilities
- Notification intent API (event-based)
- Multi-channel delivery (Email, SMS, Push, In-App, WhatsApp, Webhooks)
- Provider abstraction and failover
- Template management with versioning
- Retry, DLQ, throttling, and rate limits
- Analytics and reporting
- Multi-tenant isolation

#### Channels (Phase-based)
- Phase 1: Email, SMS
- Phase 2: Push, In-App
- Phase 3: WhatsApp, Voice, USSD

#### Templates
- Versioned templates
- Multi-language support
- Variable schema validation
- Approval workflow
- Tenant branding

#### Delivery & Reliability
- Retry policies per channel
- Idempotency keys
- Dead-letter queues
- Provider health checks
- Fallback routing

#### Security & Compliance
- RBAC
- Tenant isolation
- Audit logs (immutable)
- Data retention policies

### 1.5 Out of Scope (v1)
- Marketing campaign automation
- CRM functionality
- AI-generated content

### 1.6 Personas
- Platform Engineer
- Product Manager
- Government IT Admin
- DevOps Engineer

### 1.7 Non-Functional Requirements
- Availability: 99.9%
- Horizontal scalability
- Async-first architecture
- GDPR-style data controls
- Sub-second API response (enqueue)

---

## 2. PostgreSQL ERD (Production-Ready)

### 2.1 Core Tables

#### tenants
- id (UUID, PK)
- name
- code
- status
- created_at

#### users
- id (UUID, PK)
- tenant_id (FK)
- email
- phone
- preferences (JSONB)

#### notification_intents
- id (UUID, PK)
- tenant_id (FK)
- event_key
- priority
- payload (JSONB)
- idempotency_key
- created_at

#### notifications
- id (UUID, PK)
- intent_id (FK)
- channel
- template_id (FK)
- status
- scheduled_at

#### delivery_attempts
- id (UUID, PK)
- notification_id (FK)
- provider_id (FK)
- attempt_no
- status
- response
- created_at

#### templates
- id (UUID, PK)
- tenant_id (FK)
- channel
- language
- version
- content
- status

#### providers
- id (UUID, PK)
- channel
- name
- config (JSONB)
- is_active

#### audit_logs
- id (UUID, PK)
- tenant_id (FK)
- entity
- entity_id
- action
- actor
- created_at

### 2.2 Relationships
- tenant 1..* users
- tenant 1..* templates
- intent 1..* notifications
- notification 1..* delivery_attempts

---

## 3. OpenAPI 3.1 Specification (Draft)

### 3.1 API Info

```yaml
openapi: 3.1.0
info:
  title: UrutiNotify API
  version: 1.0.0
  description: Unified Notification Platform API
```

### 3.2 Authentication
- OAuth2 / JWT
- Tenant-scoped tokens

### 3.3 Core Endpoints

#### Create Notification Intent
```yaml
POST /v1/notifications
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/NotificationRequest'
responses:
  '202':
    description: Accepted
```

#### Get Notification Status
```yaml
GET /v1/notifications/{id}
responses:
  '200':
    description: Status
```

#### Manage Templates
```yaml
POST /v1/templates
GET /v1/templates
PUT /v1/templates/{id}
```

#### Providers
```yaml
POST /v1/providers
GET /v1/providers
```

### 3.4 Schemas

```yaml
components:
  schemas:
    NotificationRequest:
      type: object
      properties:
        tenantId:
          type: string
        event:
          type: string
        recipients:
          type: array
          items:
            type: object
        channels:
          type: array
          items:
            type: string
        template:
          type: string
        priority:
          type: string
```

---

## 4. Integration with UrutiWorkflow
- BPMN Service Task: SendNotification
- Async, fire-and-forget
- Correlation via intent_id

---

## 5. Success Metrics
- Delivery success rate > 98%
- Mean enqueue latency < 200ms
- Provider failover success < 2s

---

## 6. Roadmap Summary
- MVP: Email + SMS + REST
- Scale: Push, Kafka, Analytics
- Advanced: WhatsApp, Voice, Cost Optimization

---

**Document Owner:** Uruti Hub Limited

