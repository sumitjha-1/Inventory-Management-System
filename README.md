# Centralized Office Administration System

A web-based office administration and inventory management system built with Node.js, Express, MongoDB, and EJS. It provides role-based dashboards for administrators, inventory holders, and regular users, with user approval workflows and item assignment tracking.

## Features

### User registration and authentication
- Register with a six-digit User ID and personal/employment details.
- Validate whether a User ID, email address, or phone number already exists.
- Store passwords as bcrypt hashes.
- Keep new registrations in a pending state until an administrator approves them.
- Support session-based login, logout, and a “Remember me” session duration.

### Role-based dashboards
- **Administrator:** Review pending and approved users, manage user roles and statuses, and view inventory records.
- **Inventory holder:** View inventory for their group, add and update items, assign custodians, and review deleted or condemned items.
- **Regular user:** View items assigned to or issued to them and manage permitted profile settings.

### Inventory management
- Create inventory records with ledger number, item name, quantity, unit, procurement date, group, and custodian.
- Validate ledger numbers and prevent duplicate ledger numbers.
- Assign items to custodians.
- Track item states such as available, assigned, issued, deleted, and condemned.
- Search inventory tables and export visible rows to CSV from the frontend.

### Profile and interface
- Update a user's designation and change their password after validating the current password.
- Toggle light and dark themes.
- Use a collapsible sidebar and profile panel.
- Display system settings through administrator routes.

## Technology Stack

- **Runtime:** Node.js
- **Server:** Express
- **Database:** MongoDB
- **ODM:** Mongoose
- **Templating:** EJS
- **Authentication:** `express-session`
- **Password hashing:** `bcryptjs`
- **Frontend:** HTML, CSS, JavaScript
- **Configuration:** `dotenv`

## Project Structure

```text
Centralized-Office-Administration-System/
├── models/
│   ├── Item.js
│   └── User.js
├── public/
│   ├── css/
│   │   ├── admin.css
│   │   ├── inventoryholder.css
│   │   ├── login.css
│   │   ├── register.css
│   │   └── user.css
│   └── js/
│       ├── admin.js
│       ├── inventoryholder.js
│       ├── login.js
│       ├── register.js
│       └── user.js
├── views/
│   ├── admin.ejs
│   ├── inventoryholder.ejs
│   ├── login.ejs
│   ├── register.ejs
│   └── user.ejs
├── .env
├── .gitignore
├── package.json
└── server.js
```

The supplied directory listing did not show a `views/` folder or `package.json`, but the server expects the EJS templates listed above and a Node.js dependency manifest. Keep those files in the project before running it.

## Prerequisites

- Node.js and npm
- MongoDB running locally or a MongoDB connection URI
- A terminal in the project directory

## Installation and Setup

1. Install Node.js if it is not already installed.
2. Open the project directory:

   ```bash
   cd Centralized-Office-Administration-System
   ```

3. Install dependencies:

   ```bash
   npm install express mongoose bcryptjs express-session dotenv ejs
   ```

4. Create a `.env` file in the project root:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/inventory_system
   SESSION_SECRET=replace_this_with_a_long_random_secret
   PORT=3000
   NODE_ENV=development
   ```

5. Start MongoDB.
6. Start the application:

   ```bash
   node server.js
   ```

7. Open `http://localhost:3000` in your browser.

If the project includes a `package.json` with scripts, use the scripts defined there. For development, you can optionally install `nodemon` and run the server with it.

## Default Administrator Account

On startup, the application attempts to create a default administrator if the configured database does not already contain User ID `000000`.

| Field | Default value |
|---|---|
| User ID | `000000` |
| Password | `admin@123` |

**Security warning:** These are development defaults from the application code. Change or remove the default credentials before deploying the system, and do not expose a deployment that still uses them.

## Application Workflow

1. A person submits the registration form.
2. The application checks for duplicate User IDs, email addresses, and phone numbers.
3. A new account is stored with `pending` status.
4. An administrator reviews the registration and approves or rejects the account.
5. Approved users sign in and are redirected to the dashboard for their role.
6. Inventory holders manage items within their group and assign custodians.
7. Users view their associated inventory records from their dashboard.

## Routes Overview

The application uses server-rendered pages and JSON endpoints. The following routes are defined in `server.js`.

### Pages and authentication

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/` | Redirect to dashboard or login |
| `GET` | `/login` | Render login page |
| `POST` | `/login` | Authenticate user |
| `GET` | `/register` | Render registration page |
| `POST` | `/register` | Register a new user |
| `GET` | `/logout` | Destroy the current session |
| `GET` | `/dashboard` | Redirect based on user role |
| `GET` | `/user/dashboard` | User dashboard |
| `GET` | `/inventory/dashboard` | Inventory-holder dashboard |
| `GET` | `/admin/dashboard` | Administrator dashboard |

### Validation endpoints

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/check-userid?userId=123456` | Check six-digit User ID availability |
| `GET` | `/check-email?email=user@example.com` | Check email availability |
| `GET` | `/check-phone?phone=9876543210` | Check phone number availability |

### Administrator endpoints

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/admin/user-details/:id` | Retrieve user details |
| `POST` | `/admin/update-user-status/:id` | Update user approval status |
| `POST` | `/admin/update-user-role/:id` | Update user role |
| `DELETE` | `/admin/delete-user/:id` | Delete a user |
| `GET` | `/admin/system-settings` | Read the system settings response |
| `POST` | `/admin/save-settings` | Accept settings payload |

### Profile endpoints

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/update-profile` | Update designation and optionally change password |

### Inventory endpoints

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/inventory/add-item` | Create an inventory item |
| `GET` | `/inventory/get-item/:id` | Retrieve an item |
| `PUT` | `/inventory/update-item/:id` | Update an item |
| `POST` | `/inventory/assign-custodian/:id` | Assign a custodian |
| `POST` | `/inventory/condemn-items` | Mark eligible items as condemned |
| `DELETE` | `/inventory/delete-item/:id` | Mark an item as deleted |

Most write endpoints expect JSON or form data according to the frontend request. The route handlers should be reviewed to confirm authorization and group-level access rules before production use.

## Data Models

### User
The user model stores identity and employment information, including User ID, name, email, phone, designation, cadre, group, employment type, role, account status, and a hashed password.

Typical roles include:
- `admin`
- `inventory_holder`
- `user`

Registration status includes `pending` and `approved`.

### Item
The item model represents inventory records and links items to groups and users, including custodian and issued-to references. It tracks procurement details and item status.

## Configuration Notes

- The application defaults to `mongodb://localhost:27017/inventory_system` if `MONGODB_URI` is not configured.
- The server defaults to port `3000` unless `PORT` is set.
- The session secret currently has a hard-coded fallback in the code. Set a strong `SESSION_SECRET` in the environment and remove the fallback for production.
- The code currently initializes the HTTP server in `server.js`; make sure there is only one server startup call.
- The database connection options `useNewUrlParser` and `useUnifiedTopology` are unnecessary in current Mongoose versions and may need to be removed if they cause warnings or errors.

## Security and Production Checklist

Before deploying this application:

- Change the default administrator password and avoid printing credentials to logs.
- Set a strong, unique `SESSION_SECRET`.
- Configure secure session cookies (`httpOnly`, `secure` in HTTPS production, and an appropriate `sameSite` value).
- Use HTTPS and add CSRF protection for session-authenticated state-changing routes.
- Enforce role and group authorization on every inventory mutation. Authentication alone should not grant every logged-in user inventory-holder privileges.
- Validate request bodies and IDs server-side, including quantity and date values.
- Review profile updates so users can only change fields they are authorized to edit.
- Protect administrator endpoints against unauthorized status or role changes.
- Add rate limiting, structured logging, and tests for authentication, registration, inventory operations, and authorization.
- Ensure deleted or condemned records cannot be modified through other routes unless explicitly intended.
- Store secrets only in environment variables and never commit `.env`.

This repository should be treated as a development project until these controls have been reviewed and tested.


