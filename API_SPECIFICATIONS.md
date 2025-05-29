# API Specifications

## Table of Contents
- [1. Properties API](#1-properties-api)
  - [1.1 List Properties](#11-list-properties)
  - [1.2 Get Single Property](#12-get-single-property)
  - [1.3 Create Property](#13-create-property)
  - [1.4 Update Property](#14-update-property)
  - [1.5 Delete Property](#15-delete-property)
  - [1.6 Track Property Click](#16-track-property-click)
- [2. Team Members API](#2-team-members-api)
  - [2.1 List Team Members](#21-list-team-members)
  - [2.2 Get Single Team Member](#22-get-single-team-member)
  - [2.3 Create Team Member](#23-create-team-member)
  - [2.4 Update Team Member](#24-update-team-member)
  - [2.5 Delete Team Member](#25-delete-team-member)
- [3. Settings API](#3-settings-api)
  - [3.1 Get All Settings](#31-get-all-settings)
  - [3.2 Update All Settings](#32-update-all-settings)
- [4. Users & Authentication API](#4-users--authentication-api)
  - [4.1 Login for Access Token](#41-login-for-access-token)
  - [4.2 Get Current User Details](#42-get-current-user-details)
  - [4.3 Create User](#43-create-user)
  - [4.4 List Users](#44-list-users)
  - [4.5 Get Single User](#45-get-single-user)
  - [4.6 Update User](#46-update-user)
  - [4.7 Delete User](#47-delete-user)
- [5. Contacts API](#5-contacts-api)
  - [5.1 Create Contact Submission](#51-create-contact-submission)
  - [5.2 List Contact Submissions](#52-list-contact-submissions)
  - [5.3 Get Single Contact Submission](#53-get-single-contact-submission)
  - [5.4 Update Contact Submission](#54-update-contact-submission)
  - [5.5 Delete Contact Submission](#55-delete-contact-submission)
  - [5.6 Generate PDF for Contact Submission](#56-generate-pdf-for-contact-submission)
  - [5.7 Forward Contact Submission via Email](#57-forward-contact-submission-via-email)

---

## 1. Properties API
Base Path: `/api/properties`

### 1.1 List Properties
- **Endpoint Name/Purpose:** Fetch all public listings, with filtering and pagination.
- **HTTP Method:** `GET`
- **URL Path:** `/`
- **Authentication/Authorization:** Public (Optional authentication via `get_optional_current_user` from [`backend/routers/properties.py`](backend/routers/properties.py:86); behavior might differ for authenticated users, e.g., staff seeing assigned properties).
- **Request Parameters:**
    - Query Parameters:
        - `skip: int = 0` (Offset for pagination)
        - `limit: int = 20` (Number of items per page, default is 20 in the router, but can be overridden)
        - `search: Optional[str] = None` (Search term for property titles, descriptions, etc.)
        - `property_type: Optional[str] = None` (e.g., "House", "Apartment")
        - `listing_type: Optional[str] = None` (e.g., "Venta de propiedad", "Renta")
        - `min_price: Optional[float] = None` (Minimum price filter)
        - `max_price: Optional[float] = None` (Maximum price filter)
        - `min_bedrooms: Optional[int] = None` (Minimum bedrooms filter)
        - `max_bedrooms: Optional[int] = None` (Maximum bedrooms filter)
        - `min_bathrooms: Optional[int] = None` (Minimum bathrooms filter)
        - `max_bathrooms: Optional[int] = None` (Maximum bathrooms filter)
        - `min_area: Optional[float] = None` (Minimum square feet/area filter)
        - `max_area: Optional[float] = None` (Maximum square feet/area filter)
- **Response:**
    - Success: `200 OK`
    - Body: `List[schemas.Property]` (from [`backend/schemas.py`](backend/schemas.py:56))
    - Example:
      ```json
      [
        {
          "id": 101,
          "title": "Beautiful Beachfront Villa",
          "description": "A stunning villa with direct beach access and ocean views.",
          "price": 1250000.00,
          "location": "Sunny Isles, FL",
          "property_type": "Villa",
          "listing_type": "Venta de propiedad",
          "bedrooms": 5,
          "bathrooms": 4,
          "square_feet": 3500,
          "image_url": "http://example.com/images/main_villa.jpg",
          "latitude": 25.9396,
          "longitude": -80.1224,
          "is_featured": true,
          "created_at": "2024-05-30T10:00:00Z",
          "updated_at": "2024-05-30T12:30:00Z",
          "images": [
            {
              "id": 1,
              "property_id": 101,
              "image_url": "http://example.com/images/villa_pool.jpg",
              "order": 0
            }
          ],
          "clicks": [],
          "assigned_to_id": 1,
          "created_by_user_id": 2,
          "assigned_to": {
            "id": 1,
            "username": "manager_user",
            "email": "manager@example.com",
            "role": "manager"
          },
          "created_by": {
            "id": 2,
            "username": "admin_user",
            "email": "admin@example.com",
            "role": "admin"
          }
        }
      ]
      ```
    - Errors: `400 Bad Request`, `422 Unprocessable Entity`

### 1.2 Get Single Property
- **Endpoint Name/Purpose:** Fetch details for a specific property.
- **HTTP Method:** `GET`
- **URL Path:** `/{property_id}/`
- **Authentication/Authorization:** Public.
- **Request Parameters:**
    - Path Parameters:
        - `property_id: int` (ID of the property to retrieve)
- **Response:**
    - Success: `200 OK`
    - Body: `schemas.Property` (from [`backend/schemas.py`](backend/schemas.py:56))
    - Example:
      ```json
      {
        "id": 101,
        "title": "Beautiful Beachfront Villa",
        "description": "A stunning villa with direct beach access and ocean views.",
        "price": 1250000.00,
        "location": "Sunny Isles, FL",
        "property_type": "Villa",
        "listing_type": "Venta de propiedad",
        "bedrooms": 5,
        "bathrooms": 4,
        "square_feet": 3500,
        "image_url": "http://example.com/images/main_villa.jpg",
        "latitude": 25.9396,
        "longitude": -80.1224,
        "is_featured": true,
        "created_at": "2024-05-30T10:00:00Z",
        "updated_at": "2024-05-30T12:30:00Z",
        "images": [
          {
            "id": 1,
            "property_id": 101,
            "image_url": "http://example.com/images/villa_pool.jpg",
            "order": 0
          },
          {
            "id": 2,
            "property_id": 101,
            "image_url": "http://example.com/images/villa_interior.jpg",
            "order": 1
          }
        ],
        "clicks": [
          {
              "id": 1,
              "property_id": 101,
              "ip_address": "192.168.1.100",
              "user_agent": "Mozilla/5.0 (...)",
              "clicked_at": "2024-05-30T11:00:00Z"
          }
        ],
        "assigned_to_id": 1,
        "created_by_user_id": 2,
        "assigned_to": {
          "id": 1,
          "username": "manager_user",
          "email": "manager@example.com",
          "role": "manager"
        },
        "created_by": {
          "id": 2,
          "username": "admin_user",
          "email": "admin@example.com",
          "role": "admin"
        }
      }
      ```
    - Errors: `404 Not Found`

### 1.3 Create Property
- **Endpoint Name/Purpose:** Create a new property listing.
- **HTTP Method:** `POST`
- **URL Path:** `/`
- **Authentication/Authorization:** Authenticated (Role: Manager or Admin via `auth_utils.require_manager` from [`backend/auth/utils.py`](backend/auth/utils.py:79)).
- **Request Parameters:**
    - Request Body: `schemas.PropertyCreate` (from [`backend/schemas.py`](backend/schemas.py:42))
    - Example:
      ```json
      {
        "title": "Beautiful Beachfront Villa",
        "description": "A stunning villa with direct beach access and ocean views.",
        "price": 1250000.00,
        "location": "Sunny Isles, FL",
        "property_type": "Villa",
        "listing_type": "Venta de propiedad",
        "bedrooms": 5,
        "bathrooms": 4,
        "square_feet": 3500,
        "image_url": "http://example.com/images/main_villa.jpg",
        "latitude": 25.9396,
        "longitude": -80.1224,
        "is_featured": true,
        "assigned_to_id": 1,
        "additional_image_urls": [
          "http://example.com/images/villa_pool.jpg",
          "http://example.com/images/villa_interior.jpg"
        ]
      }
      ```
- **Response:**
    - Success: `201 Created`
    - Body: `schemas.Property` (from [`backend/schemas.py`](backend/schemas.py:56))
    - Example: (Similar to "Get Single Property" response, with `created_by_user_id` set to the authenticated user)
    - Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `422 Unprocessable Entity`

### 1.4 Update Property
- **Endpoint Name/Purpose:** Update an existing property listing.
- **HTTP Method:** `PUT`
- **URL Path:** `/{property_id}/`
- **Authentication/Authorization:** Authenticated (Role: Manager or Admin via `auth_utils.require_manager` from [`backend/auth/utils.py`](backend/auth/utils.py:79)).
- **Request Parameters:**
    - Path Parameters:
        - `property_id: int` (ID of the property to update)
    - Request Body: `schemas.PropertyUpdate` (from [`backend/schemas.py`](backend/schemas.py:46))
    - Example:
      ```json
      {
        "title": "Updated Beachfront Villa with Pool",
        "price": 1300000.00,
        "is_featured": false,
        "additional_image_urls": [
          "http://example.com/images/villa_garden.jpg"
        ],
        "delete_image_ids": [1]
      }
      ```
- **Response:**
    - Success: `200 OK`
    - Body: `schemas.Property` (from [`backend/schemas.py`](backend/schemas.py:56))
    - Example: (Similar to "Get Single Property" response, reflecting the updates)
    - Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`

### 1.5 Delete Property
- **Endpoint Name/Purpose:** Delete a property listing.
- **HTTP Method:** `DELETE`
- **URL Path:** `/{property_id}/`
- **Authentication/Authorization:** Authenticated (Role: Manager or Admin via `auth_utils.require_manager` from [`backend/auth/utils.py`](backend/auth/utils.py:79)).
- **Request Parameters:**
    - Path Parameters:
        - `property_id: int` (ID of the property to delete)
- **Response:**
    - Success: `204 No Content`
    - Errors: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 1.6 Track Property Click
- **Endpoint Name/Purpose:** Record a click event for a property.
- **HTTP Method:** `POST`
- **URL Path:** `/{property_id}/track-click/`
- **Authentication/Authorization:** Public.
- **Request Parameters:**
    - Path Parameters:
        - `property_id: int` (ID of the property for which to track the click)
    - Request Body: (No explicit JSON body from client. The server uses the `Request` object to get IP address and User-Agent.)
- **Response:**
    - Success: `201 Created`
    - Body: `schemas.PropertyClick` (from [`backend/schemas.py`](backend/schemas.py:192))
    - Example:
      ```json
      {
          "id": 1,
          "property_id": 101,
          "ip_address": "192.168.1.100",
          "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "clicked_at": "2024-05-30T11:00:00Z"
      }
      ```
    - Errors: `404 Not Found`, `500 Internal Server Error`

---

## 2. Team Members API
Base Path: `/api/team`

### 2.1 List Team Members
- **Endpoint Name/Purpose:** Fetch all team members.
- **HTTP Method:** `GET`
- **URL Path:** `/`
- **Authentication/Authorization:** Public.
- **Request Parameters:**
    - Query Parameters:
        - `skip: int = 0` (Offset for pagination)
        - `limit: int = 100` (Number of items per page)
- **Response:**
    - Success: `200 OK`
    - Body: `List[schemas.TeamMember]` (from [`backend/schemas.py`](backend/schemas.py:146))
    - Example:
      ```json
      [
        {
          "id": 5,
          "name": "Jane Doe",
          "position": "Lead Architect",
          "image_url": "http://example.com/team/jane_doe.jpg",
          "order": 1
        },
        {
          "id": 6,
          "name": "John Smith",
          "position": "Senior Developer",
          "image_url": "http://example.com/team/john_smith.jpg",
          "order": 2
        }
      ]
      ```

### 2.2 Get Single Team Member
- **Endpoint Name/Purpose:** Fetch details for a specific team member.
- **HTTP Method:** `GET`
- **URL Path:** `/{member_id}/`
- **Authentication/Authorization:** Public.
- **Request Parameters:**
    - Path Parameters:
        - `member_id: int` (ID of the team member to retrieve)
- **Response:**
    - Success: `200 OK`
    - Body: `schemas.TeamMember` (from [`backend/schemas.py`](backend/schemas.py:146))
    - Example:
      ```json
      {
        "id": 5,
        "name": "Jane Doe",
        "position": "Lead Architect",
        "image_url": "http://example.com/team/jane_doe.jpg",
        "order": 1
      }
      ```
    - Errors: `404 Not Found`

### 2.3 Create Team Member
- **Endpoint Name/Purpose:** Add a new team member.
- **HTTP Method:** `POST`
- **URL Path:** `/`
- **Authentication/Authorization:** Authenticated (Role: Admin via `auth_utils.require_admin` from [`backend/auth/utils.py`](backend/auth/utils.py:73)).
- **Request Parameters:**
    - Request Body: `schemas.TeamMemberCreate` (from [`backend/schemas.py`](backend/schemas.py:137))
    - Example:
      ```json
      {
        "name": "Alice Wonderland",
        "position": "Project Manager",
        "image_url": "http://example.com/team/alice.jpg",
        "order": 3
      }
      ```
- **Response:**
    - Success: `201 Created`
    - Body: `schemas.TeamMember` (from [`backend/schemas.py`](backend/schemas.py:146))
    - Example:
      ```json
      {
        "id": 7,
        "name": "Alice Wonderland",
        "position": "Project Manager",
        "image_url": "http://example.com/team/alice.jpg",
        "order": 3
      }
      ```
    - Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `422 Unprocessable Entity`

### 2.4 Update Team Member
- **Endpoint Name/Purpose:** Update an existing team member.
- **HTTP Method:** `PUT`
- **URL Path:** `/{member_id}/`
- **Authentication/Authorization:** Authenticated (Role: Admin via `auth_utils.require_admin` from [`backend/auth/utils.py`](backend/auth/utils.py:73)).
- **Request Parameters:**
    - Path Parameters:
        - `member_id: int` (ID of the team member to update)
    - Request Body: `schemas.TeamMemberUpdate` (from [`backend/schemas.py`](backend/schemas.py:140))
    - Example:
      ```json
      {
        "position": "Senior Project Manager",
        "order": 0
      }
      ```
- **Response:**
    - Success: `200 OK`
    - Body: `schemas.TeamMember` (from [`backend/schemas.py`](backend/schemas.py:146))
    - Example: (Reflecting the updates)
      ```json
      {
        "id": 7,
        "name": "Alice Wonderland",
        "position": "Senior Project Manager",
        "image_url": "http://example.com/team/alice.jpg",
        "order": 0
      }
      ```
    - Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`

### 2.5 Delete Team Member
- **Endpoint Name/Purpose:** Delete a team member.
- **HTTP Method:** `DELETE`
- **URL Path:** `/{member_id}/`
- **Authentication/Authorization:** Authenticated (Role: Admin via `auth_utils.require_admin` from [`backend/auth/utils.py`](backend/auth/utils.py:73)).
- **Request Parameters:**
    - Path Parameters:
        - `member_id: int` (ID of the team member to delete)
- **Response:**
    - Success: `204 No Content`
    - Errors: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

---

## 3. Settings API
Base Path: `/api/settings`

### 3.1 Get All Settings
- **Endpoint Name/Purpose:** Fetch all site settings.
- **HTTP Method:** `GET`
- **URL Path:** `/`
- **Authentication/Authorization:** Public.
- **Response:**
    - Success: `200 OK`
    - Body: `Dict[str, schemas.SiteSetting]` (from [`backend/schemas.py`](backend/schemas.py:125))
    - Example:
      ```json
      {
        "site_title": {
          "key": "site_title",
          "value": "Habitat Real Estate",
          "category": "General"
        },
        "contact_email": {
          "key": "contact_email",
          "value": "contact@habitat.com",
          "category": "Contact"
        },
        "maintenance_mode": {
          "key": "maintenance_mode",
          "value": false,
          "category": "Advanced"
        }
      }
      ```

### 3.2 Update All Settings
- **Endpoint Name/Purpose:** Update site settings in bulk.
- **HTTP Method:** `PUT`
- **URL Path:** `/`
- **Authentication/Authorization:** Authenticated (Role: Admin via `auth_utils.require_admin` from [`backend/auth/utils.py`](backend/auth/utils.py:73)).
- **Request Parameters:**
    - Request Body: `Dict[str, dict]` (where each inner dict corresponds to fields of `schemas.SiteSettingUpdate` (from [`backend/schemas.py`](backend/schemas.py:121)) or `schemas.SiteSettingBase` (from [`backend/schemas.py`](backend/schemas.py:113)) for a given key)
    - Example:
      ```json
      {
        "site_title": {
          "value": "Habitat Luxury Real Estate"
        },
        "contact_email": {
          "value": "info@habitat-luxury.com",
          "category": "Contact Info"
        },
        "new_setting_key": {
          "value": {"feature_enabled": true, "threshold": 10},
          "category": "Features"
        }
      }
      ```
- **Response:**
    - Success: `200 OK`
    - Body: `Dict[str, schemas.SiteSetting]` (from [`backend/schemas.py`](backend/schemas.py:125))
    - Example: (Reflecting the updates)
      ```json
      {
        "site_title": {
          "key": "site_title",
          "value": "Habitat Luxury Real Estate",
          "category": "General"
        },
        "contact_email": {
          "key": "contact_email",
          "value": "info@habitat-luxury.com",
          "category": "Contact Info"
        },
        "new_setting_key": {
          "key": "new_setting_key",
          "value": {"feature_enabled": true, "threshold": 10},
          "category": "Features"
        },
        "maintenance_mode": {
          "key": "maintenance_mode",
          "value": false,
          "category": "Advanced"
        }
      }
      ```
    - Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `422 Unprocessable Entity`

---

## 4. Users & Authentication API
Base Path: `/api/users`

### 4.1 Login for Access Token
- **Endpoint Name/Purpose:** Authenticate user and obtain JWT.
- **HTTP Method:** `POST`
- **URL Path:** `/token/`
- **Authentication/Authorization:** Public.
- **Request Parameters:**
    - Request Body: `OAuth2PasswordRequestForm` (Standard FastAPI form, typically sent as `application/x-www-form-urlencoded`)
        - `username: str`
        - `password: str`
        - `scope: str = ""` (Optional)
        - `grant_type: str` (Implicitly "password")
    - Example (form data): `username=admin_user&password=securePassword123`
- **Response:**
    - Success: `200 OK`
    - Body: `schemas.Token` (from [`backend/schemas.py`](backend/schemas.py:100))
    - Example:
      ```json
      {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbl91c2VyIiwiZXhwIjoxNzE5ODU3ODAwfQ.example_token_signature",
        "token_type": "bearer"
      }
      ```
    - Errors: `401 Unauthorized` (Incorrect username or password)

### 4.2 Get Current User Details
- **Endpoint Name/Purpose:** Fetch details for the currently authenticated user.
- **HTTP Method:** `GET`
- **URL Path:** `/me/`
- **Authentication/Authorization:** Authenticated (Any Role via `auth_utils.get_current_active_user` from [`backend/auth/utils.py`](backend/auth/utils.py:68)).
- **Response:**
    - Success: `200 OK`
    - Body: `schemas.User` (from [`backend/schemas.py`](backend/schemas.py:93))
    - Example:
      ```json
      {
        "id": 1,
        "username": "admin_user",
        "email": "admin@example.com",
        "role": "admin"
      }
      ```
    - Errors: `401 Unauthorized`

### 4.3 Create User
- **Endpoint Name/Purpose:** Create a new user.
- **HTTP Method:** `POST`
- **URL Path:** `/`
- **Authentication/Authorization:** Authenticated (Role: Admin via `auth_utils.require_admin` from [`backend/auth/utils.py`](backend/auth/utils.py:73)).
- **Request Parameters:**
    - Request Body: `schemas.UserCreate` (from [`backend/schemas.py`](backend/schemas.py:84))
    - Example:
      ```json
      {
        "username": "new_staff_member",
        "email": "staff@example.com",
        "password": "securePassword123",
        "role": "staff"
      }
      ```
- **Response:**
    - Success: `201 Created`
    - Body: `schemas.User` (from [`backend/schemas.py`](backend/schemas.py:93))
    - Example:
      ```json
      {
        "id": 10,
        "username": "new_staff_member",
        "email": "staff@example.com",
        "role": "staff"
      }
      ```
    - Errors: `400 Bad Request` (e.g., username already registered), `401 Unauthorized`, `403 Forbidden`, `422 Unprocessable Entity`

### 4.4 List Users
- **Endpoint Name/Purpose:** Fetch a list of users.
- **HTTP Method:** `GET`
- **URL Path:** `/`
- **Authentication/Authorization:** Authenticated (Role: Manager or Admin via `auth_utils.require_manager` from [`backend/auth/utils.py`](backend/auth/utils.py:79)).
- **Request Parameters:**
    - Query Parameters:
        - `skip: int = 0` (Offset for pagination)
        - `limit: int = 100` (Number of items per page)
- **Response:**
    - Success: `200 OK`
    - Body: `List[schemas.User]` (from [`backend/schemas.py`](backend/schemas.py:93))
    - Example:
      ```json
      [
        {
          "id": 1,
          "username": "admin_user",
          "email": "admin@example.com",
          "role": "admin"
        },
        {
          "id": 2,
          "username": "manager_user",
          "email": "manager@example.com",
          "role": "manager"
        }
      ]
      ```
    - Errors: `401 Unauthorized`, `403 Forbidden`

### 4.5 Get Single User
- **Endpoint Name/Purpose:** Fetch details for a specific user.
- **HTTP Method:** `GET`
- **URL Path:** `/{user_id}/`
- **Authentication/Authorization:** Authenticated (Role: Admin via `auth_utils.require_admin` from [`backend/auth/utils.py`](backend/auth/utils.py:73)).
- **Request Parameters:**
    - Path Parameters:
        - `user_id: int` (ID of the user to retrieve)
- **Response:**
    - Success: `200 OK`
    - Body: `schemas.User` (from [`backend/schemas.py`](backend/schemas.py:93))
    - Example:
      ```json
      {
        "id": 2,
        "username": "manager_user",
        "email": "manager@example.com",
        "role": "manager"
      }
      ```
    - Errors: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 4.6 Update User
- **Endpoint Name/Purpose:** Update an existing user.
- **HTTP Method:** `PUT`
- **URL Path:** `/{user_id}/`
- **Authentication/Authorization:** Authenticated (Role: Admin via `auth_utils.require_admin` from [`backend/auth/utils.py`](backend/auth/utils.py:73)).
- **Request Parameters:**
    - Path Parameters:
        - `user_id: int` (ID of the user to update)
    - Request Body: `schemas.UserUpdate` (from [`backend/schemas.py`](backend/schemas.py:87))
    - Example:
      ```json
      {
        "email": "updated_staff_member@example.com",
        "role": "manager",
        "password": "newStrongPassword456"
      }
      ```
- **Response:**
    - Success: `200 OK`
    - Body: `schemas.User` (from [`backend/schemas.py`](backend/schemas.py:93))
    - Example: (Reflecting the updates)
      ```json
      {
        "id": 10,
        "username": "new_staff_member",
        "email": "updated_staff_member@example.com",
        "role": "manager"
      }
      ```
    - Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`

### 4.7 Delete User
- **Endpoint Name/Purpose:** Delete a user.
- **HTTP Method:** `DELETE`
- **URL Path:** `/{user_id}/`
- **Authentication/Authorization:** Authenticated (Role: Admin via `auth_utils.require_admin` from [`backend/auth/utils.py`](backend/auth/utils.py:73)).
- **Request Parameters:**
    - Path Parameters:
        - `user_id: int` (ID of the user to delete)
- **Response:**
    - Success: `204 No Content`
    - Errors: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

---

## 5. Contacts API
Base Path: `/api/contact`

### 5.1 Create Contact Submission
- **Endpoint Name/Purpose:** Submit a new contact form entry.
- **HTTP Method:** `POST`
- **URL Path:** `/`
- **Authentication/Authorization:** Public.
- **Request Parameters:**
    - Request Body: `schemas.ContactCreate` (from [`backend/schemas.py`](backend/schemas.py:162))
    - Example:
      ```json
      {
        "name": "John Applicant",
        "email": "john.applicant@example.com",
        "phone": "555-123-4567",
        "subject": "Inquiry about Property #101",
        "message": "I am very interested in the beachfront villa. Could I schedule a viewing?",
        "property_id": 101
      }
      ```
- **Response:**
    - Success: `201 Created`
    - Body: `schemas.Contact` (from [`backend/schemas.py`](backend/schemas.py:169))
    - Example:
      ```json
      {
        "id": 25,
        "name": "John Applicant",
        "email": "john.applicant@example.com",
        "phone": "555-123-4567",
        "subject": "Inquiry about Property #101",
        "message": "I am very interested in the beachfront villa. Could I schedule a viewing?",
        "property_id": 101,
        "submitted_at": "2024-05-30T14:00:00Z",
        "is_read": false,
        "assigned_to_id": null,
        "assigned_to": null
      }
      ```
    - Errors: `400 Bad Request`, `422 Unprocessable Entity`

### 5.2 List Contact Submissions
- **Endpoint Name/Purpose:** Fetch all contact submissions.
- **HTTP Method:** `GET`
- **URL Path:** `/`
- **Authentication/Authorization:** Authenticated (Role: Staff, Manager, or Admin via `auth_utils.require_staff` from [`backend/auth/utils.py`](backend/auth/utils.py:85)).
- **Request Parameters:**
    - Query Parameters:
        - `skip: int = 0` (Offset for pagination)
        - `limit: int = 100` (Number of items per page)
- **Response:**
    - Success: `200 OK`
    - Body: `List[schemas.Contact]` (from [`backend/schemas.py`](backend/schemas.py:169))
    - Example:
      ```json
      [
        {
          "id": 25,
          "name": "John Applicant",
          "email": "john.applicant@example.com",
          "phone": "555-123-4567",
          "subject": "Inquiry about Property #101",
          "message": "I am very interested in the beachfront villa. Could I schedule a viewing?",
          "property_id": 101,
          "submitted_at": "2024-05-30T14:00:00Z",
          "is_read": false,
          "assigned_to_id": null,
          "assigned_to": null
        },
        {
          "id": 26,
          "name": "Jane Inquiry",
          "email": "jane.inquiry@example.com",
          "phone": "555-987-6543",
          "subject": "General Question",
          "message": "What are your office hours?",
          "property_id": null,
          "submitted_at": "2024-05-31T09:15:00Z",
          "is_read": true,
          "assigned_to_id": 2,
          "assigned_to": {
            "id": 2,
            "username": "manager_user",
            "email": "manager@example.com",
            "role": "manager"
          }
        }
      ]
      ```
    - Errors: `401 Unauthorized`, `403 Forbidden`

### 5.3 Get Single Contact Submission
- **Endpoint Name/Purpose:** Fetch details for a specific contact submission.
- **HTTP Method:** `GET`
- **URL Path:** `/{submission_id}/`
- **Authentication/Authorization:** Authenticated (Role: Staff, Manager, or Admin via `auth_utils.require_staff` from [`backend/auth/utils.py`](backend/auth/utils.py:85)).
- **Request Parameters:**
    - Path Parameters:
        - `submission_id: int` (ID of the contact submission to retrieve)
- **Response:**
    - Success: `200 OK`
    - Body: `schemas.Contact` (from [`backend/schemas.py`](backend/schemas.py:169))
    - Example:
      ```json
      {
        "id": 25,
        "name": "John Applicant",
        "email": "john.applicant@example.com",
        "phone": "555-123-4567",
        "subject": "Inquiry about Property #101",
        "message": "I am very interested in the beachfront villa. Could I schedule a viewing?",
        "property_id": 101,
        "submitted_at": "2024-05-30T14:00:00Z",
        "is_read": false,
        "assigned_to_id": null,
        "assigned_to": null
      }
      ```
    - Errors: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 5.4 Update Contact Submission
- **Endpoint Name/Purpose:** Update a contact submission (e.g., mark as read, assign).
- **HTTP Method:** `PUT`
- **URL Path:** `/{submission_id}/`
- **Authentication/Authorization:** Authenticated (Role: Manager or Admin via `auth_utils.require_manager` from [`backend/auth/utils.py`](backend/auth/utils.py:79)).
- **Request Parameters:**
    - Path Parameters:
        - `submission_id: int` (ID of the contact submission to update)
    - Request Body: `schemas.ContactUpdate` (from [`backend/schemas.py`](backend/schemas.py:165))
    - Example:
      ```json
      {
        "is_read": true,
        "assigned_to_id": 2
      }
      ```
- **Response:**
    - Success: `200 OK`
    - Body: `schemas.Contact` (from [`backend/schemas.py`](backend/schemas.py:169))
    - Example: (Reflecting the updates)
      ```json
      {
        "id": 25,
        "name": "John Applicant",
        "email": "john.applicant@example.com",
        "phone": "555-123-4567",
        "subject": "Inquiry about Property #101",
        "message": "I am very interested in the beachfront villa. Could I schedule a viewing?",
        "property_id": 101,
        "submitted_at": "2024-05-30T14:00:00Z",
        "is_read": true,
        "assigned_to_id": 2,
        "assigned_to": {
            "id": 2,
            "username": "manager_user",
            "email": "manager@example.com",
            "role": "manager"
          }
      }
      ```
    - Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`

### 5.5 Delete Contact Submission
- **Endpoint Name/Purpose:** Delete a contact submission.
- **HTTP Method:** `DELETE`
- **URL Path:** `/{submission_id}/`
- **Authentication/Authorization:** Authenticated (Role: Manager or Admin via `auth_utils.require_manager` from [`backend/auth/utils.py`](backend/auth/utils.py:79)).
- **Request Parameters:**
    - Path Parameters:
        - `submission_id: int` (ID of the contact submission to delete)
- **Response:**
    - Success: `204 No Content`
    - Errors: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 5.6 Generate PDF for Contact Submission
- **Endpoint Name/Purpose:** Generate a PDF document for a contact submission.
- **HTTP Method:** `GET`
- **URL Path:** `/{submission_id}/pdf/`
- **Authentication/Authorization:** Authenticated (Role: Manager or Admin via `auth_utils.require_manager` from [`backend/auth/utils.py`](backend/auth/utils.py:79)).
- **Request Parameters:**
    - Path Parameters:
        - `submission_id: int` (ID of the contact submission for PDF generation)
- **Response:**
    - Success: `200 OK`
    - Body: `application/pdf` (The raw PDF content)
    - Headers: `Content-Disposition: attachment; filename=contact_{submission_id}.pdf`
    - Errors: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`

### 5.7 Forward Contact Submission via Email
- **Endpoint Name/Purpose:** Send a contact submission's details to an email address.
- **HTTP Method:** `POST`
- **URL Path:** `/{submission_id}/send-email/`
- **Authentication/Authorization:** Authenticated (Role: Manager or Admin via `auth_utils.require_manager` from [`backend/auth/utils.py`](backend/auth/utils.py:79)).
- **Request Parameters:**
    - Path Parameters:
        - `submission_id: int` (ID of the contact submission to forward)
    - Request Body: (Optional) `{"recipient_email": "user@example.com"}`. The schema is `recipient_email: str | None = Body(None, embed=True)`.
    - Example:
      ```json
      {
        "recipient_email": "manager_user@example.com"
      }
      ```
      (Or an empty body `{}` or no body if `recipient_email` is truly optional and defaults are handled server-side)
- **Response:**
    - Success: `204 No Content`
    - Errors: `400 Bad Request` (e.g., no recipient email could be determined), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error` (e.g., SMTP configuration error or sending failure)