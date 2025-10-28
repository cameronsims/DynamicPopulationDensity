# Hive Matrix

A React-based dashboard application for monitoring and managing IoT nodes with Microsoft authentication integration.

## Features

-  Authentication
  - Microsoft SSO integration (MSAL)
  - Demo login support
  - Auto refresh tokens
  - Inactivity detection & auto-logout

-  Dashboard
  - Real-time node status monitoring
  - Location-based filtering
  - Power BI visualizations integration
  - Activity heatmaps

-  Locations
  - Location management (add/edit/delete)
  - Building/level/room organization
  - Node assignment

-  Nodes
  - Node management (add/edit/delete)
  - Status monitoring (online/offline)
  - Hardware details tracking
  - Location assignment

## Tech Stack

- **Frontend**
  - React 19
  - TypeScript
  - Vite
  - TailwindCSS
  - React Router v7
  - MSAL for authentication
  - Power BI client integration

- **Backend**
  - Express
  - MongoDB
  - JWT authentication
  - Cookie-based refresh tokens

## Project Structure

```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create `.env.local` file:
```env
VITE_API_BASE=http://localhost:8080
VITE_AZ_CLIENT_ID=your_azure_client_id
VITE_AZ_TENANT_ID=your_azure_tenant_id
VITE_AZ_REDIRECT_URI=http://localhost:5173
```

3. Start development servers:
```bash
# Frontend
npm run dev

# Backend
cd hivemetrics-bridge
npm run dev
```

## Authentication Flow

1. **Microsoft SSO**
   - Uses MSAL for Microsoft authentication
   - Handles redirect flow
   - Mints local JWTs for API access

2. **Demo Login**
   - Email/password authentication
   - JWT + Refresh token flow
   - Auto refresh mechanism

3. **Token Management**
   - Access tokens expire in 10 minutes
   - Refresh tokens valid for 7 days
   - Auto refresh before expiration
   - Inactivity detection (10 minutes)

## API Routes

### Authentication
- `POST /v1/auth/login` - Demo login
- `POST /v1/auth/refresh` - Refresh access token
- `POST /v1/auth/logout` - Logout
- `POST /v1/auth/msal-bridge` - Microsoft auth bridge

### Nodes
- `GET /v1/nodes/all` - List all nodes
- `POST /v1/nodes` - Create node
- `DELETE /v1/nodes/:id` - Delete node
- `GET /v1/nodes/summary` - Node status summary

### Locations
- `GET /v1/locations/all` - List all locations
- `POST /v1/locations` - Create location
- `DELETE /v1/locations/:id` - Delete location

### Power BI
- `GET /v1/powerbi/embed-config` - Get embed configuration

## Development

### Key Files
- `useAuth.tsx` - Authentication hook and context
- `AppLayout.tsx` - Main application layout
- `Dashboard.tsx` - Main dashboard view
- `server.js` - Express backend server

### Commands
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run linter
npm run typecheck  # Type checking
```

## Environment Variables

### Frontend (.env.local)
```env
VITE_API_BASE=http://localhost:8080
VITE_AZ_CLIENT_ID=your_client_id
VITE_AZ_TENANT_ID=your_tenant_id
VITE_AZ_REDIRECT_URI=http://localhost:5173
VITE_AZ_LOGOUT_REDIRECT=http://localhost:5173/login
```

### Backend (.env)
```env
MONGODB_URI=your_mongodb_uri
DB_NAME=your_db_name
PORT=8080
AZ_TENANT_ID=your_tenant_id
AZ_CLIENT_ID=your_client_id
AZ_CLIENT_SECRET=your_client_secret
