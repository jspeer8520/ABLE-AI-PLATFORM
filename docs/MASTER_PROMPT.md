# ABLE AI PLATFORM
# MASTER DEVELOPMENT GOVERNANCE PROMPT

Version: 1.0  
Status: ACTIVE  
Authority Level: HIGHEST  
Owner: ABLE Engineering Governance

---

# 1. PURPOSE

This document is the governing constitution for building the ABLE AI PLATFORM.

It defines:

- How ABLE is built
- How decisions are made
- How AI developers operate
- How features are approved
- How quality is maintained
- When development can advance

This document overrides informal instructions.

The specification is the source of truth.

---

# 2. CORE PRINCIPLE

ABLE is built:


ONCE

CORRECTLY

PRODUCTION READY

WITHOUT TECHNICAL DEBT


The objective is not rapid code generation.

The objective is a secure, scalable, maintainable production platform.

---

# 3. NON-NEGOTIABLE RULES

---

# RULE 1
# SPECIFICATION IS LAW

Every feature must exist in documentation before implementation.

Required:


Requirement

↓

Specification

↓

Implementation

↓

Testing

↓

Deployment


If a feature is not documented:

IT DOES NOT EXIST.

---

# RULE 2
# PRODUCTION QUALITY ONLY

All generated code must be production quality.

Forbidden:

- Placeholder code
- Fake implementations
- Temporary solutions
- Disabled security
- Hardcoded secrets
- Unfinished functions
- TODO shortcuts

Every component must include:

- Validation
- Error handling
- Security controls
- Documentation
- Tests

---

# RULE 3
# PHASE ORDER CANNOT BE SKIPPED

ABLE must be built in this exact order:


PHASE 1
Bootstrap

PHASE 2
Database

PHASE 3
Authentication

PHASE 4
Products + Checkout

PHASE 5
Billing

PHASE 6
Usage Tracking

PHASE 7
Creator CRM

PHASE 8
Email

PHASE 9
AI Workflows

PHASE 10
Admin

PHASE 11
Deployment


A phase cannot begin until the previous phase is complete.

---

# RULE 4
# FILE STRUCTURE IS SACRED

The project structure must remain organized.

Primary locations:


/docs

/apps

/packages

/services

/tests

/config


Files must exist in their correct location.

Do not create random files.

---

# RULE 5
# EVERY PHASE REQUIRES PROOF

A phase is complete only when:

Required:

[✓] Code implemented

[✓] Tests passing

[✓] Security reviewed

[✓] Documentation updated

[✓] End-to-end functionality verified

[✓] No critical errors

---

Completion format:


PHASE X COMPLETE

Deliverables:

Feature list
Files created
Tests completed

Tests:

PASS / TOTAL

Ready for next phase?


---

# RULE 6
# BILLING IS SACRED

Revenue systems cannot be added later.

Billing architecture must include:

- Payment provider integration
- Subscription management
- Usage tracking
- Credit accounting
- Server-side enforcement

Never trust:

- Frontend pricing
- Client payment state
- User-provided subscription information

---

# RULE 7
# SECURITY FIRST

Security applies everywhere.

Required:

Authentication:

- Identity verification
- Session security

Authorization:

- RBAC
- Permission checks

Data:

- Encryption
- Validation

Infrastructure:

- Secret management
- Logging

AI:

- Tool restrictions
- Prompt protection
- Data boundaries

---

# RULE 8
# DOCUMENTATION IS REQUIRED

Every system requires documentation.

Required documents:


Architecture

Database

API

Security

Agents

Billing

Workflows

Deployment

Testing

Roadmap

Master Prompt


No undocumented systems.

---

# 4. AI DEVELOPER OPERATING RULES

AI development agents must:

Before coding:

1. Read relevant documentation
2. Identify current phase
3. Confirm requirements
4. Plan implementation

During coding:

1. Follow architecture
2. Protect security boundaries
3. Validate inputs
4. Write tests

After coding:

1. Run tests
2. Update documentation
3. Report completion

---

# 5. AI AGENT BEHAVIOR

AI agents must:

- Follow instructions
- Respect permissions
- Ask when requirements conflict
- Avoid assumptions
- Preserve architecture

AI agents must not:

- Rewrite unrelated systems
- Skip testing
- Remove security
- Create undocumented features

---

# 6. CHANGE CONTROL

New ideas must follow:


Feature Request

↓

Documentation Update

↓

Roadmap Placement

↓

Implementation

↓

Testing


No scope creep.

---

# 7. DEBUGGING PROTOCOL

When errors occur:

AI must:

1. Stop feature development
2. Identify root cause
3. Explain failure
4. Fix issue
5. Verify solution

Do not:

- Hide errors
- Disable tests
- Ignore warnings

---

# 8. SECURITY PROTOCOL

Every feature review includes:

Questions:


Who can access it?

What data does it use?

What permissions are required?

What happens if abused?

How is it audited?


---

# 9. AI WORKFLOW GOVERNANCE

AI systems require:

- Defined purpose
- Defined permissions
- Defined tools
- Defined memory rules
- Defined evaluation criteria

No uncontrolled autonomous actions.

---

# 10. COMMUNICATION PROTOCOL

When instructed:

## "continue"

Meaning:

Proceed with current approved phase.

---

## "fix [error]"

Meaning:

Stop progress.

Debug only.

---

## "next phase"

Meaning:

Confirm completion and advance.

---

## "backlog [feature]"

Meaning:

Record feature for future implementation.

Do not interrupt current phase.

---

# 11. COMPLETION STANDARD

ABLE is complete when:


Users can register

Users can create products

Customers can purchase

Subscriptions work

AI assistants operate

Workflows execute

Emails send

Admins manage platform

Security is validated

Tests pass

Production deployment succeeds


---

# 12. FINAL DEVELOPMENT COMMANDMENT

The ABLE platform must always prioritize:

1. Security
2. Reliability
3. Maintainability
4. Scalability
5. User experience
6. Innovation

Speed without quality is failure.

Quality creates a platform.

---

# 13. GOVERNANCE ACCEPTANCE

All developers, human or AI, working on ABLE agree to:

- Follow specifications
- Protect the architecture
- Maintain quality standards
- Document decisions
- Complete phases correctly