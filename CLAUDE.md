# ABLE AI PLATFORM
# CLAUDE DEVELOPMENT INSTRUCTIONS

Version: 1.0  
Status: ACTIVE  
Authority: MASTER_PROMPT.md

---

# 1. ROLE

You are the primary AI development agent for the ABLE AI PLATFORM.

Your responsibility is to build ABLE according to:

- MASTER_PROMPT.md
- ROADMAP.md
- ARCHITECTURE.md
- SECURITY.md
- DATABASE.md
- API_SPEC.md
- AGENTS.md
- BILLING.md
- WORKFLOWS.md
- DEPLOYMENT.md
- TESTING.md

These documents are the source of truth.

---

# 2. CURRENT DEVELOPMENT PHASE

Current Phase:

PHASE 1 - BOOTSTRAP FOUNDATION

Objective:

Create the production-ready engineering foundation.

---

# 3. PHASE 1 REQUIREMENTS

The Bootstrap phase must establish:

## Repository Structure

Required:


ABLE-AI-PLATFORM/

├── apps/
│ ├── web/
│ └── mobile/

├── backend/

├── packages/

├── services/

├── ai/

├── docs/

├── tests/

├── config/

├── scripts/

├── .env.example

├── docker-compose.yml

├── README.md

├── package.json

└── CLAUDE.md


---

# 4. DEVELOPMENT RULES

Before creating files:

1. Check documentation.
2. Confirm correct location.
3. Follow existing architecture.
4. Avoid unnecessary dependencies.

---

# 5. CODE QUALITY REQUIREMENTS

All code must include:

- Error handling
- Validation
- Security considerations
- Documentation
- Testing support

Never create:

- Placeholder code
- Fake APIs
- Temporary hacks
- Hardcoded secrets

---

# 6. ENVIRONMENT RULES

Never commit:


.env

.env.local

secrets

API keys

private credentials


Only commit:


.env.example


Example:


DATABASE_URL=

AUTH_SECRET=

STRIPE_SECRET_KEY=

AI_MODEL=

AI_ENDPOINT=


---

# 7. GIT RULES

Every meaningful change requires:


git add .

git commit -m "description"


Commit messages must describe the change.

Examples:

Good:


Add initial project structure


Bad:


stuff


---

# 8. TESTING REQUIREMENTS

Before marking work complete:

Run:

- Build checks
- Lint checks
- Tests
- Security checks

Report results.

---

# 9. ERROR HANDLING PROTOCOL

When an error occurs:

STOP.

Do:

1. Read error message.
2. Identify root cause.
3. Fix underlying issue.
4. Test solution.
5. Document changes.

Do not:

- Ignore errors
- Disable security
- Remove tests

---

# 10. AI AGENT RULES

AI agents must:

- Respect permissions
- Protect user data
- Log actions
- Follow workflows

Agents cannot:

- Modify their own permissions
- Access secrets
- Bypass security
- Deploy without approval

---

# 11. PHASE COMPLETION FORMAT

When Phase 1 is complete respond:


PHASE 1 COMPLETE ✅

Deliverables:

Repository structure created
Development environment configured
Dependencies installed
CI foundation created
Documentation connected

Tests:

PASS / TOTAL

Issues:

None

Ready for Phase 2?


---

# 12. FIRST BOOTSTRAP TASKS

Execute in order:

## Step 1

Create directories.

## Step 2

Initialize Git.

## Step 3

Create package configuration.

## Step 4

Create environment templates.

## Step 5

Create Docker foundation.

## Step 6

Create testing structure.

## Step 7

Create CI workflow.

## Step 8

Verify installation.

---

# 13. BOOTSTRAP SUCCESS CRITERIA

Phase 1 passes when:

[✓] Folder structure exists

[✓] Git repository initialized

[✓] Package management configured

[✓] Environment templates created

[✓] Docker configured

[✓] CI configured

[✓] Documentation linked

[✓] No critical errors