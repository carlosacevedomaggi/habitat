# Plan for Creating DATA_FLOW_DIAGRAMS.md

This document outlines the plan for creating the `DATA_FLOW_DIAGRAMS.md` file, which will detail the data flow for the 'listings' and 'team members' entities.

## 1. Introduction

*   Briefly state the document's purpose: to illustrate data flow for core entities ('listings' and 'team members') to aid understanding, debugging, and maintenance.

## 2. Listings Data Flow

*   **Primary Visual:** A Mermaid sequence diagram (adapted and refined from existing diagrams in `DATA_LIFECYCLE_ANALYSIS.md`) illustrating the end-to-end flow.
*   **Detailed Textual Elaboration:** Accompanying text to explain aspects of the flow, including:
    *   **Data Sources:**
        *   Database seeding via [`backend/seed_data.py`](backend/seed_data.py:1) (noting the default `status="available"` for new properties from [`backend/models.py`](backend/models.py:43)).
        *   Admin Panel creation/updates (user input leading to API calls).
    *   **Backend Processing:**
        *   **Models:** [`Property` model](backend/models.py:43) in [`backend/models.py`](backend/models.py:43) (key fields: `status`, `is_featured`).
        *   **CRUD Layer:** Operations in [`backend/crud/properties.py`](backend/crud/properties.py:1) (e.g., `get_properties`, `create_property`, `update_property`), detailing how `status` is handled (or not by default in `get_properties`).
        *   **API Layer:** Endpoints in [`backend/routers/properties.py`](backend/routers/properties.py:1) (e.g., `GET /api/properties/`, `POST /api/properties/`, `GET /api/properties/{id}/`, `PUT /api/properties/{id}/`). Specify authentication requirements for admin-specific routes.
    *   **Frontend Consumption (Data Sinks):**
        *   **Admin Side:** Data fetching and display in [`frontend/pages/admin/properties/index.js`](frontend/pages/admin/properties/index.js:1).
        *   **Public Side:** Data fetching for list view ([`frontend/pages/properties/index.js`](frontend/pages/properties/index.js:1) via [`frontend/services/propertyService.js`](frontend/services/propertyService.js:1)) and detail view ([`frontend/pages/properties/[id].js`](frontend/pages/properties/[id].js:1)). Discuss `status` filtering.
    *   **Key Transformations/Logic:** Default `status`, admin's ability to change `status`, impact of `status` on public visibility.

## 3. Team Members Data Flow

*   **Primary Visual:** A Mermaid sequence diagram (adapted and refined from `DATA_LIFECYCLE_ANALYSIS.md`).
*   **Detailed Textual Elaboration:**
    *   **Data Sources:** Seeding via [`backend/seed_data.py`](backend/seed_data.py:1), Admin Panel creation/updates.
    *   **Backend Processing:** [`TeamMember` model](backend/models.py:87) (no `status` field), CRUD ops in [`backend/crud/team.py`](backend/crud/team.py:1), API endpoints in [`backend/routers/team.py`](backend/routers/team.py:1).
    *   **Frontend Consumption (Data Sinks):** Admin side ([`frontend/pages/admin/team/index.js`](frontend/pages/admin/team/index.js:1)), Public side ([`frontend/pages/about.js`](frontend/pages/about.js:1)). Highlight potential frontend issues.
    *   **Key Transformations/Logic:** Data generally presented as-is; `order` field for sorting.

## 4. General Considerations for Both Flows

*   Distinguish admin vs. public paths.
*   Identify key API endpoints.
*   Pinpoint data sources and sinks.