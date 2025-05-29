# Module Functionalities and Interdependencies

This document outlines the primary functionalities of key frontend and backend modules and their interdependencies, with a particular focus on listings (properties) and team member features. It draws information from the codebase and existing documentation such as [`PROJECT_STRUCTURE_AND_INTERACTIONS.md`](PROJECT_STRUCTURE_AND_INTERACTIONS.md:1) and [`DATA_LIFECYCLE_ANALYSIS.md`](DATA_LIFECYCLE_ANALYSIS.md:1).

## Frontend

### Pages

#### 1. [`frontend/pages/properties/index.js`](frontend/pages/properties/index.js:1) (Public Property List Page)
*   **Functionality:** Displays a list of publicly available properties. Allows users to filter properties based on various criteria (category, bedrooms, bathrooms, area, price). Includes a map view with pins for filtered properties and sliders for properties grouped by type.
*   **Key Dependencies:**
    *   `useState`, `useMemo` (from 'react'): For managing local state (filters, active category) and memoizing filtered results.
    *   [`../../components/MapWithPins`](frontend/components/MapWithPins.js:1): Renders a map displaying property locations. Receives filtered properties.
    *   [`../../services/propertyService`](frontend/services/propertyService.js:1) (`fetchProperties`): Fetches property data from the backend API during server-side rendering (`getServerSideProps`).
    *   [`../../components/PropertySlider`](frontend/components/PropertySlider.js:1): Displays properties of a specific type in a slider/carousel format. Receives a list of properties for a given type.
    *   [`../../components/PropertyFilter`](frontend/components/PropertyFilter.js:1): Provides UI elements for filtering properties. Manages filter state and applies them. Receives all properties to derive filter options.

#### 2. [`frontend/pages/properties/[id].js`](frontend/pages/properties/[id].js:1) (Public Property Detail Page)
*   **Functionality:** Displays detailed information for a single property, including title, description, price, location, images (carousel), features (bedrooms, bathrooms, area), and a map showing its specific location. It also includes a contact form for users to inquire about the property and tracks property view clicks.
*   **Key Dependencies:**
    *   `useRouter` (from 'next/router'): To access the property `id` from the URL query.
    *   `useEffect`, `useState` (from 'react'): For managing component state (property data, loading, error, contact form).
    *   `Head` (from 'next/head'): To set page-specific metadata (title, description).
    *   [`../../components/ImageCarousel`](frontend/components/ImageCarousel.js:1): Displays property images in a carousel. Receives a list of image URLs and alt text.
    *   [`../../components/MapDisplay`](frontend/components/Map.js:1) (imported as `MapDisplay`): Renders a map showing the single property's location. Receives latitude and longitude.
    *   `toast` (from 'react-toastify'): For displaying success/error notifications for form submissions.
    *   Direct API calls (using `fetch`):
        *   To `/api/properties/{id}/`: Fetches details of the specific property.
        *   To `/api/properties/{id}/track-click`: Sends a POST request to log a view/click for the property.
        *   To `/api/contact/`: Submits the contact form data.
    *   `process.env.NEXT_PUBLIC_API_BASE_URL`: Used to construct full image URLs if they are relative and served from the backend.

#### 3. [`frontend/pages/about.js`](frontend/pages/about.js:1) (Public About Us Page)
*   **Functionality:** Displays information about the company, including its mission, vision, history, and values. It also fetches and displays a list of team members. Content for titles and paragraphs is largely driven by settings fetched via `SettingsContext`.
*   **Key Dependencies:**
    *   `useEffect`, `useState` (from 'react'): For managing state related to team members (data, loading, error).
    *   `Head` (from 'next/head'): For setting page metadata.
    *   [`../context/SettingsContext`](frontend/context/SettingsContext.js:1) (`useSettings`): To fetch and display dynamic content for various sections of the page (e.g., `about_title`, `about_page_main_title`, `team_title`).
    *   `process.env.NEXT_PUBLIC_API_URL`: Used to construct the API endpoint for fetching team members.
    *   `process.env.NEXT_PUBLIC_BACKEND_STATIC_ROOT`: Used to construct full image URLs for team members if their `image_url` is relative.
    *   Direct API call (using `fetch`):
        *   To `/api/team/`: Fetches the list of team members.

#### 4. [`frontend/pages/admin/properties/index.js`](frontend/pages/admin/properties/index.js:1) (Admin Property Management Page)
*   **Functionality:** Allows admin/manager/staff users to view a list of all properties. Provides functionality to add new properties, edit existing ones (by navigating to an edit page), delete properties, and assign properties to staff/manager users (if the current user is admin/manager). Displays key property details and metadata like creation/update timestamps and click counts on hover.
*   **Key Dependencies:**
    *   `useEffect`, `useState` (from 'react'): For managing state (properties list, loading, error, current user, assignable users, assignment status).
    *   `Link` (from 'next/link'): For navigation to add/edit property pages.
    *   `useRouter` (from 'next/router'): For navigation (e.g., to login, to edit page).
    *   [`../../../components/AdminLayout`](frontend/components/AdminLayout.js:1): Provides the overall structure and navigation for admin pages.
    *   `Head` (from 'next/head'): For setting the page title.
    *   `toast` (from 'react-toastify'): For displaying notifications (success/error messages for operations).
    *   Direct API calls (using `fetch` and `localStorage` for token):
        *   To `/api/users/me`: Fetches details of the currently authenticated admin user.
        *   To `/api/users/`: Fetches a list of users for the assignment dropdown (if admin/manager).
        *   To `/api/properties/?limit=1000`: Fetches the list of all properties.
        *   To `/api/properties/{id}` (PUT): Updates property assignment.
        *   To `/api/properties/{id}` (DELETE): Deletes a property.

### Services

#### 1. [`frontend/services/propertyService.js`](frontend/services/propertyService.js:1)
*   **Functionality:** Provides functions to interact with the backend property-related API endpoints. It handles constructing the correct API base URL depending on whether it's running server-side or client-side.
    *   `fetchProperties(query)`: Fetches a list of properties. Can accept a query string for filtering, pagination, etc. Used by the public properties list page.
    *   `fetchProperty(id)`: Fetches details for a single property by its ID.
*   **Key Dependencies:**
    *   `process.env.NEXT_PUBLIC_API_URL`: Used to construct the base URL for API calls.
    *   `fetch` (global): For making HTTP requests to the backend.

#### 2. [`frontend/services/settingsService.js`](frontend/services/settingsService.js:1)
*   **Functionality:** Provides functions to interact with the backend settings API.
    *   `fetchSiteSettings()`: Fetches all site settings from the backend.
*   **Key Dependencies:**
    *   `process.env.NEXT_PUBLIC_API_BASE_URL`: Used to construct the API endpoint for settings. (Note: This service uses `NEXT_PUBLIC_API_BASE_URL` while `propertyService` uses `NEXT_PUBLIC_API_URL`. Consistency might be reviewed).
    *   `fetch` (global): For making HTTP requests.

### Contexts

#### 1. [`frontend/context/SettingsContext.js`](frontend/context/SettingsContext.js:1)
*   **Functionality:** Manages global site settings. Fetches settings from the backend API on initial load, provides these settings to consuming components, and applies theme-related settings (colors, fonts, background image) to the application dynamically using CSS custom properties. Offers a `getSetting` function to retrieve specific settings with fallbacks and a `refreshSettings` function to reload settings.
*   **Key Dependencies:**
    *   `createContext`, `useContext`, `useState`, `useEffect` (from 'react'): For creating and managing context state.
    *   Direct API call (using `fetch`):
        *   To `/api/settings/`: Fetches all site settings.
    *   Interacts directly with `document.documentElement.style` and `document.body.style` to apply theme settings.

### Reusable Components

#### 1. [`frontend/components/PropertyCard.js`](frontend/components/PropertyCard.js:1)
*   **Functionality:** A simple component intended to display a summary of a single property (title, location, price). It's a placeholder and likely used within property listing views or sliders.
*   **Key Dependencies:**
    *   Receives a `property` object as a prop.

#### 2. [`frontend/components/AdminLayout.js`](frontend/components/AdminLayout.js:1)
*   **Functionality:** Provides the main layout structure for all admin panel pages. It handles authentication checks (verifying JWT token), role-based access control for navigation links and page access, and displays a common header with navigation and a footer.
*   **Key Dependencies:**
    *   `useEffect`, `useState` (from 'react'): For managing authentication state, loading state, and admin user details.
    *   `Link` (from 'next/link'): For navigation links within the admin panel.
    *   `useRouter` (from 'next/router'): For programmatic navigation (e.g., redirecting to login if not authenticated or unauthorized).
    *   `Head` (from 'next/head'): To set a default title for admin pages.
    *   [`../context/SettingsContext`](frontend/context/SettingsContext.js:1) (`useSettings`): To access settings, potentially for role-based feature toggles (e.g., `non_admin_can_view_all_contacts`).
    *   Direct API call (using `fetch` and `localStorage` for token):
        *   To `/api/users/me`: Verifies the token and fetches authenticated user details.

#### 3. [`frontend/components/LeafletMap.js`](frontend/components/LeafletMap.js:1) (Note: File is named `LeafletMap.js`, task refers to `MapWithPins.js` which might be an alias or older name. This component seems to be the primary map implementation for multiple pins).
*   **Functionality:** Renders an interactive map using Leaflet. Displays multiple property pins based on their latitude and longitude. Clicking a pin navigates to the respective property's detail page. Tooltips on markers show a brief summary (image, price, type).
*   **Key Dependencies:**
    *   `MapContainer`, `TileLayer`, `Marker`, `Tooltip` (from 'react-leaflet'): Core Leaflet components for React.
    *   `useRouter` (from 'next/router'): For navigating to property detail pages on marker click.
    *   `L` (from 'leaflet'): Leaflet library itself, used for icon customization.
    *   `Image` (from 'next/image'): Used within tooltips to display property images.
    *   'leaflet/dist/leaflet.css': Leaflet's base CSS.
    *   Receives `properties` (array of property objects) and `height` as props.

## Backend

### Routers

#### 1. [`backend/routers/properties.py`](backend/routers/properties.py:1)
*   **Functionality:** Defines API endpoints for property-related operations. Handles routing requests to the appropriate CRUD functions. Includes endpoints for listing properties (with filtering and pagination), retrieving a single property, creating, updating, and deleting properties. Also includes an endpoint for tracking property clicks. Implements optional authentication for listing properties (to potentially show different data to authenticated users) and requires manager-level authentication for CUD operations.
*   **Key Dependencies:**
    *   `APIRouter`, `Depends`, `HTTPException`, `status`, `Request` (from 'fastapi').
    *   `Session` (from 'sqlalchemy.orm').
    *   [`core.database`](backend/core/database.py:1) (`get_db`): Dependency to get a database session.
    *   [`schemas`](backend/schemas.py:1) (e.g., `schemas.Property`, `schemas.PropertyCreate`, `schemas.PropertyUpdate`, `schemas.PropertyClick`): For request/response data validation and serialization.
    *   [`models`](backend/models.py:1) (e.g., `models.User`): For type hinting and ORM interaction.
    *   [`crud.property`](backend/crud/properties.py:1) (as `crud_property`): Contains the business logic for property CRUD operations.
    *   [`crud.property_clicks`](backend/crud/property_clicks.py:1) (`create_property_click`): For logging property views/clicks.
    *   [`auth.utils`](backend/auth/utils.py:1) (as `auth_utils`): For authentication dependencies (`oauth2_scheme`, `require_manager`).
    *   `jwt`, `JWTError` (from 'jose'): Used in `get_optional_current_user` for decoding JWTs.
    *   [`core.config`](backend/core/config.py:1) (`settings`): For accessing JWT secret key and algorithm.
    *   [`crud.user`](backend/crud/users.py:1) (as `crud_user`): Used in `get_optional_current_user` to fetch user details from the token.

#### 2. [`backend/routers/team.py`](backend/routers/team.py:1)
*   **Functionality:** Defines API endpoints for team member-related operations. Provides endpoints for listing all team members, retrieving a single team member, and admin-only endpoints for creating, updating, and deleting team members. Public listing is unauthenticated.
*   **Key Dependencies:**
    *   `APIRouter`, `Depends`, `HTTPException`, `status` (from 'fastapi').
    *   `Session` (from 'sqlalchemy.orm').
    *   [`core.database`](backend/core/database.py:1) (`get_db`): For database sessions.
    *   [`schemas`](backend/schemas.py:1) (e.g., `schemas.TeamMember`, `schemas.TeamMemberCreate`, `schemas.TeamMemberUpdate`): For data validation and serialization.
    *   [`models`](backend/models.py:1) (e.g., `models.User`): For type hinting current admin user.
    *   [`crud.team`](backend/crud/team.py:1) (as `crud_team`): Contains business logic for team member CRUD.
    *   [`auth.utils`](backend/auth/utils.py:1) (as `auth_utils`): For `require_admin` authentication dependency on CUD operations.

#### 3. [`backend/routers/settings.py`](backend/routers/settings.py:1)
*   **Functionality:** Defines API endpoints for managing site settings. Provides an endpoint to fetch all current site settings (publicly accessible) and an admin-only endpoint to bulk update settings.
*   **Key Dependencies:**
    *   `APIRouter`, `Depends` (from 'fastapi').
    *   `Session` (from 'sqlalchemy.orm').
    *   `Dict` (from 'typing').
    *   [`core.database`](backend/core/database.py:1) (`get_db`): For database sessions.
    *   [`schemas`](backend/schemas.py:1) (e.g., `schemas.SiteSetting`): For response data serialization.
    *   [`models`](backend/models.py:1) (e.g., `models.User`): For type hinting current admin user.
    *   [`crud.settings`](backend/crud/settings.py:1) (as `crud_settings`): Contains business logic for settings CRUD.
    *   [`auth.utils`](backend/auth/utils.py:1) (as `auth_utils`): For `require_admin` authentication dependency on update operations.

### CRUD Modules

#### 1. [`backend/crud/properties.py`](backend/crud/properties.py:1)
*   **Functionality:** Implements the data access logic for properties.
    *   `get_properties()`: Fetches a list of properties from the database with support for pagination, search, and various filters (type, price, bedrooms, etc.). It also applies a filter to show only assigned properties if the `current_user` is 'staff'.
    *   `get_property()`: Fetches a single property by its ID.
    *   `create_property()`: Creates a new property in the database, including its additional images. Assigns `created_by_user_id` and handles `assigned_to_id` based on creator's role or input.
    *   `update_property()`: Updates an existing property's details, including managing additional images (adding new ones, deleting specified ones) and assignment.
    *   `delete_property()`: Deletes a property from the database.
*   **Key Dependencies:**
    *   `Session` (from 'sqlalchemy.orm').
    *   `List`, `Optional` (from 'typing').
    *   [`models`](backend/models.py:1) (e.g., `models.Property`, `models.PropertyImage`, `models.User`, `models.Role`): For ORM operations and type definitions.
    *   [`schemas`](backend/schemas.py:1) (e.g., `schemas.PropertyCreate`, `schemas.PropertyUpdate`): For input data type hinting.
    *   `func` (from 'sqlalchemy.sql'): Used for `func.max` when calculating order for new images.

#### 2. [`backend/crud/team.py`](backend/crud/team.py:1)
*   **Functionality:** Implements data access logic for team members.
    *   `get_team_member()`: Fetches a single team member by ID.
    *   `get_team_members()`: Fetches a list of all team members, ordered by their `order` field, with pagination.
    *   `create_team_member()`: Creates a new team member.
    *   `update_team_member()`: Updates an existing team member's details.
    *   `delete_team_member()`: Deletes a team member.
*   **Key Dependencies:**
    *   `Session` (from 'sqlalchemy.orm').
    *   `List`, `Optional` (from 'typing').
    *   [`models`](backend/models.py:1) (`models.TeamMember`): For ORM operations.
    *   [`schemas`](backend/schemas.py:1) (`schemas.TeamMemberCreate`, `schemas.TeamMemberUpdate`): For input data type hinting.

#### 3. [`backend/crud/settings.py`](backend/crud/settings.py:1)
*   **Functionality:** Implements data access logic for site settings.
    *   `get_settings()`: Fetches all site settings from the database as a dictionary.
    *   `upsert_setting()`: Creates a new setting or updates an existing one by its key.
    *   `bulk_update_settings()`: Updates multiple settings at once by calling `upsert_setting` for each.
*   **Key Dependencies:**
    *   `Session` (from 'sqlalchemy.orm').
    *   `Dict`, `Optional` (from 'typing').
    *   [`models`](backend/models.py:1) (`models.SiteSettings`): For ORM operations.
    *   ([`schemas`](backend/schemas.py:1) is imported but not directly used as type hints in function signatures in this file, though `models.SiteSettings` aligns with `schemas.SiteSetting`).

### Models ([`backend/models.py`](backend/models.py:1))

*   **Functionality:** Defines the SQLAlchemy ORM models, representing the database table structures. This includes `Property`, `PropertyImage`, `TeamMember`, `User`, `SiteSettings`, `Contact`, and `PropertyClick`. Defines relationships between tables (e.g., a `Property` has many `PropertyImage`s and `PropertyClick`s; `User` can be an owner, creator, or assignee of `Property`).
*   **Key Models for Listings & Team Members:**
    *   **`Property`**: Core model for listings. Fields include `title`, `description`, `price`, `location`, `bedrooms`, `bathrooms`, `square_feet`, `property_type`, `listing_type`, `status` (defaults to "available"), `image_url`, `latitude`, `longitude`, `is_featured`, `created_at`, `updated_at`, `owner_id`, `assigned_to_id`, `created_by_user_id`. Relationships to `User` (for owner, assigned_to, created_by), `PropertyImage`, and `PropertyClick`.
    *   **`TeamMember`**: Core model for team members. Fields include `name`, `position`, `image_url`, `order`. **Crucially, lacks an explicit status or visibility field.**
*   **Key Dependencies:**
    *   SQLAlchemy components (`Boolean`, `Column`, `Integer`, `String`, `Text`, `Float`, `DateTime`, `ForeignKey`, `JSON`, `Enum`, `relationship`, `declarative_base`, `func`).
    *   `enum` (standard Python library): For `Role` enum.

### Schemas ([`backend/schemas.py`](backend/schemas.py:1))

*   **Functionality:** Defines Pydantic models used for data validation (incoming API requests) and serialization (outgoing API responses). Ensures data conforms to expected structures and types. Includes base, create, update, and response schemas for various entities.
*   **Key Schemas for Listings & Team Members:**
    *   **Property Schemas:**
        *   `PropertyImageBase`, `PropertyImageCreate`, `PropertyImage`: For property gallery images.
        *   `PropertyBase`: Common fields for a property.
        *   `PropertyCreate`: For creating new properties, includes `additional_image_urls`.
        *   `PropertyUpdate`: For updating properties, includes `additional_image_urls` and `delete_image_ids`.
        *   `Property` (response schema): Includes `id`, timestamps, `images` list, `clicks` list, and nested `User` details for `assigned_to` and `created_by`.
    *   **Team Member Schemas:**
        *   `TeamMemberBase`: Common fields for a team member.
        *   `TeamMemberCreate`: For creating new team members.
        *   `TeamMemberUpdate`: For updating team members.
        *   `TeamMember` (response schema): Includes `id`.
*   **Key Dependencies:**
    *   Pydantic components (`BaseModel`, `EmailStr`, `HttpUrl`).
    *   `List`, `Optional`, `Any` (from 'typing').
    *   `datetime` (standard Python library).
    *   `Enum` (standard Python library, used for `Role` enum within schemas).
    *   Uses forward references (e.g., `Optional['User']`) for related schemas to handle circular dependencies, resolved with `model_rebuild()`.