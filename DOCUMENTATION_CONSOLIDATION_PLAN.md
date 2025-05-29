# Documentation Consolidation Plan

**Date:** May 29, 2025

## 1. Introduction

This document outlines the plan for consolidating existing application documentation and formally establishing the new suite of Markdown documents (created in Phase 1 and 2) as the canonical source of truth. This effort is based on the findings of the `EXISTING_DOCS_AUDIT_REPORT.md`.

The primary goals are to:
*   Eliminate outdated, irrelevant, and redundant information.
*   Ensure unique and valuable historical information is appropriately handled.
*   Make the new, comprehensive documentation easily discoverable and clearly designated as the primary reference.

## 2. Canonical Documentation Suite

The following documents, created during Phase 1 and Phase 2 of the documentation modernization project, now constitute the **primary, most up-to-date, and comprehensive documentation** for the application:

*   [`APPLICATION_ARCHITECTURE.md`](APPLICATION_ARCHITECTURE.md:1)
*   [`API_SPECIFICATIONS.md`](API_SPECIFICATIONS.md:1)
*   [`DATABASE_SCHEMA_DETAILS.md`](DATABASE_SCHEMA_DETAILS.md:1)
*   [`DATA_FLOW_DIAGRAMS.md`](DATA_FLOW_DIAGRAMS.md:1)
*   [`DATA_LIFECYCLE_ANALYSIS.md`](DATA_LIFECYCLE_ANALYSIS.md:1)
*   [`MODULE_FUNCTIONALITIES_AND_INTERDEPENDENCIES.md`](MODULE_FUNCTIONALITIES_AND_INTERDEPENDENCIES.md:1)
*   [`PROJECT_STRUCTURE_AND_INTERACTIONS.md`](PROJECT_STRUCTURE_AND_INTERACTIONS.md:1)
*   [`SETUP_CONFIG_DEPLOYMENT_GUIDE.md`](SETUP_CONFIG_DEPLOYMENT_GUIDE.md:1)
*   [`SYSTEM_ARCHITECTURAL_MAP.md`](SYSTEM_ARCHITECTURAL_MAP.md:1)
*   [`TROUBLESHOOTING_GUIDE.md`](TROUBLESHOOTING_GUIDE.md:1)
*   [`subtask_1_3_findings.md`](subtask_1_3_findings.md:1) (*Note: This was an interim findings report, its direct relevance as ongoing canonical documentation might be limited compared to the others, but it's listed as per the audit's source list.*)

## 3. Actions for Existing Documentation

### 3.1. [`README.md`](README.md:1)

*   **Current State (per audit):** Contains basic project description, outdated manual setup instructions, outdated usage URLs, and a minimal/redundant API list.
*   **Proposed Action:** **Update**.
*   **Details:**
    *   The basic project description will be retained and reviewed for conciseness.
    *   All outdated/redundant content regarding manual (non-Docker) setup, SQLite usage, old usage URLs, and the brief API endpoint list will be **removed**.
    *   A new "Documentation" section will be added to serve as a central hub, prominently listing and linking to all documents in the Canonical Documentation Suite (see section 2).
*   **Proposed Content for Updated [`README.md`](README.md:1) (Documentation Section):** See Section 4 of this plan.

### 3.2. [`ABOUT_PAGE_DEBUG_PLAN.md`](ABOUT_PAGE_DEBUG_PLAN.md:1)

*   **Current State (per audit):** Contains a specific, largely outdated, and redundant debugging plan for the "About Us" page.
*   **Proposed Action:** **Archive**.
*   **Reason:** Content is superseded by the comprehensive [`TROUBLESHOOTING_GUIDE.md`](TROUBLESHOOTING_GUIDE.md:1) and [`SETUP_CONFIG_DEPLOYMENT_GUIDE.md`](SETUP_CONFIG_DEPLOYMENT_GUIDE.md:1).
*   **Method:** Move to `archive/ABOUT_PAGE_DEBUG_PLAN.md`.

### 3.3. [`FILE_DOCUMENTATION.txt`](FILE_DOCUMENTATION.txt:1)

*   **Current State (per audit):** A historical debugging session log with some potentially unique but unverified frontend issue details and valuable historical context on backend fixes.
*   **Proposed Action:** **Archive**, with specific information integrated into new documentation.
*   **Reason:** Primarily a historical log. Most resolved issues are now covered by new documentation.
*   **Method:** Move to `archive/FILE_DOCUMENTATION.txt`.
*   **Unique Content Handling:**
    *   **Persistent Frontend Issues (from 05/24 log in [`FILE_DOCUMENTATION.txt`](FILE_DOCUMENTATION.txt:1)):**
        *   Identified issues: Leaflet.js SRI/CORS error, missing `default-hero-bg.jpg` 404, frontend `net::ERR_CONNECTION_TIMED_OUT` vs. backend 200/307 responses, frontend direct calls to `http://backend:8000`.
        *   **Action:** This information will be summarized and added to a new section in [`TROUBLESHOOTING_GUIDE.md`](TROUBLESHOOTING_GUIDE.md:1) titled "Known Potential Issues from Historical Logs" or similar. This section will note that these issues were logged historically and require verification to determine if they are still present or have since been resolved.
    *   **Historical Backend Fixes (Dockerfile, entrypoint, Python imports):**
        *   **Action:** This detailed historical context will remain within the archived `archive/FILE_DOCUMENTATION.txt`. Its value for understanding project evolution is acknowledged.

## 4. Proposed New Content for [`README.md`](README.md:1)

The following section is proposed to be added to the main [`README.md`](README.md:1) file, replacing any existing outdated documentation links or setup details (after the main project description).

```markdown
## Documentation

This project's comprehensive documentation is maintained in the following Markdown files. These documents serve as the canonical source of truth for understanding the application's architecture, setup, APIs, and troubleshooting.

*   **Application Overview & Architecture:**
    *   [`APPLICATION_ARCHITECTURE.md`](APPLICATION_ARCHITECTURE.md:1): Overall software architecture, components, and high-level design.
    *   [`SYSTEM_ARCHITECTURAL_MAP.md`](SYSTEM_ARCHITECTURAL_MAP.md:1): Visual map of the system components and their interactions.
    *   [`PROJECT_STRUCTURE_AND_INTERACTIONS.md`](PROJECT_STRUCTURE_AND_INTERACTIONS.md:1): Detailed breakdown of the project's directory structure and how different parts interact.
    *   [`MODULE_FUNCTIONALITIES_AND_INTERDEPENDENCIES.md`](MODULE_FUNCTIONALITIES_AND_INTERDEPENDENCIES.md:1): Description of each module, its functions, and dependencies.
*   **Data Management:**
    *   [`DATA_LIFECYCLE_ANALYSIS.md`](DATA_LIFECYCLE_ANALYSIS.md:1): Analysis of how data is created, stored, used, and archived.
    *   [`DATA_FLOW_DIAGRAMS.md`](DATA_FLOW_DIAGRAMS.md:1): Diagrams illustrating data flow through the system.
    *   [`DATABASE_SCHEMA_DETAILS.md`](DATABASE_SCHEMA_DETAILS.md:1): Detailed information about the database schema.
*   **Development & Deployment:**
    *   [`API_SPECIFICATIONS.md`](API_SPECIFICATIONS.md:1): Comprehensive details of all API endpoints.
    *   [`SETUP_CONFIG_DEPLOYMENT_GUIDE.md`](SETUP_CONFIG_DEPLOYMENT_GUIDE.md:1): Instructions for setting up, configuring, and deploying the application (Docker-focused).
*   **Support:**
    *   [`TROUBLESHOOTING_GUIDE.md`](TROUBLESHOOTING_GUIDE.md:1): Guide for diagnosing and resolving common issues.

Please refer to these documents for detailed information.
```

## 5. Archival Strategy

All documents designated for archival (`ABOUT_PAGE_DEBUG_PLAN.md`, `FILE_DOCUMENTATION.txt`) will be moved into a new subdirectory named `archive/` located at the root of the project. This preserves historical information without cluttering the main project directory.

## 6. Formal Statement of Canonical Source

Effective immediately, the suite of documents listed in Section 2 of this plan is declared the **official and canonical source of documentation** for this application. All team members should refer to these documents as the primary source of information. Older, unarchived documentation should be considered superseded unless explicitly referenced by the new canonical suite.

---
End of Plan