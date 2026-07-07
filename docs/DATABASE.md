# ABLE AI PLATFORM
# DATABASE ARCHITECTURE SPECIFICATION

Version: 1.0
Status: Active

---

# 1. Purpose

This document defines the database architecture, data models, security rules, migration standards, and operational requirements for the ABLE AI PLATFORM.

The database is the single source of truth for:

- Users
- Organizations
- Authentication
- Products
- Billing
- AI usage
- AI agents
- Conversations
- Workflows
- Security events
- Analytics

---

# 2. Database Principles

## Data Integrity

All database operations must guarantee:

- Accuracy
- Consistency
- Transaction safety
- Referential integrity

No frontend client can directly modify protected records.

---

## Security First

Database access requires:

- Authentication
- Authorization
- Least privilege access
- Audit logging
- Encryption

Sensitive information must never be exposed.

---

## Migration Control

Every database change requires:

1. Schema modification
2. Migration creation
3. Testing
4. Review
5. Deployment

Direct production changes are prohibited.

---

# 3. Database Technology

Primary Database:

PostgreSQL

ORM:

Prisma

Environments:

- Development
- Testing
- Production

---

# 4. Core Entity Relationship


USER
|
+---- ORGANIZATION
|
+---- CONVERSATION
|
+---- AI_USAGE
|
+---- AGENT_EXECUTION
|
+---- WORKFLOW
|
+---- AUDIT_LOG

ORGANIZATION
|
+---- PRODUCTS
|
+---- MEMBERS
|
+---- SUBSCRIPTIONS

CUSTOMER
|
+---- PAYMENTS


---

# 5. Core Models

## User

Purpose:

Stores platform identity.

Fields:

- id
- email
- name
- role
- organizationId
- createdAt
- updatedAt

Rules:

- Email unique
- Passwords never stored directly
- Identity managed securely

---

## Organization

Purpose:

Supports teams and enterprise accounts.

Fields:

- id
- name
- owner
- members
- createdAt

---

## Membership

Purpose:

Controls permissions.

Roles:

OWNER

ADMIN

MEMBER

VIEWER

---

# 6. Product System

Product stores:

- Name
- Description
- Price
- Status
- Owner
- Creation date

Products support:

- Digital products
- SaaS plans
- AI services

---

# 7. Billing Models

## Subscription

Tracks:

- User plan
- Organization plan
- Billing provider
- Status
- Renewal date


Plans:

- FREE
- STARTER
- PRO
- ENTERPRISE


---

## Payment

Stores:

- Transaction ID
- Provider
- Amount
- Status
- Timestamp


Never store:

- Credit card numbers
- Payment credentials

---

# 8. AI Data Models

## Conversation

Stores:

- User conversations
- Titles
- Created dates


---

## Message

Stores:

Roles:

- USER
- ASSISTANT
- SYSTEM


Contains:

- Content
- Metadata
- Timestamp


---

## Agent Execution

Tracks autonomous AI activity.

Stores:

- Agent name
- Input
- Output
- Tools used
- Execution status
- Logs


Statuses:

- QUEUED
- RUNNING
- SUCCESS
- FAILED
- CANCELLED

---

## AI Usage

Tracks:

- Model used
- Tokens consumed
- Requests
- Compute usage
- User limits

---

# 9. Workflow Database

## Workflow

Stores automation definitions.

Examples:

- AI automation
- Marketing workflows
- Business processes


## Workflow Run

Stores:

- Execution history
- Start time
- End time
- Status
- Errors

---

# 10. Security Database

## Audit Log

Tracks:

- Login
- Logout
- Account changes
- Payments
- Admin actions
- Security events


Required fields:

- User ID
- Action
- Metadata
- Timestamp

---

# 11. Indexing Requirements

Required indexes:

Users:

- email
- organizationId


Payments:

- userId
- createdAt


AI Usage:

- userId
- model
- createdAt


Audit Logs:

- userId
- action
- createdAt

---

# 12. Backup Requirements

Production database requires:

- Daily backups
- Encryption
- Restore testing
- Access controls


Recovery:

RPO:
15 minutes

RTO:
1 hour

---

# 13. Database Security Rules

Required:

- Parameterized queries
- ORM protection
- Encryption
- Environment secrets
- Access logging


Forbidden:

- Plaintext passwords
- Public database access
- Client-side database writes

---

# 14. Migration Workflow

Process:

Schema Update

↓

Migration Creation

↓

Testing

↓

Review

↓

Production Deployment


Commands:

Development:

npx prisma migrate dev


Production:

npx prisma migrate deploy

---

# 15. Completion Requirements

Database phase complete when:

[✓] Schema implemented

[✓] Relations validated

[✓] Security reviewed

[✓] Backups configured

[✓] Tests passing

[✓] Documentation complete


