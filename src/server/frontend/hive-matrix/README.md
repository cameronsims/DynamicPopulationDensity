# HiveMetrics

## note ( we have disabled microsoft authentication for deployment purpose, we were not able to register the spa(single page application) in enraID to murdoch virtual url, it kept asking for local host or https, and our app is currently in http)

demo email: demo@hivemetrics.local
password: letmein123

## 1) Tech Stack & Structure

**Frontend**: React 18, Vite, TypeScript, Tailwind, Axios, `powerbi-client-react`  
**Backend**: Node.js (Express), MongoDB (Compass / Atlas / on‑prem VM), optional `@azure/msal-node` bridge for Power BI service principal  
**Auth**: Demo (email/pw with local JWT) is ON by default; MSAL SSO is currently disabled but wired for later

## 2) Prerequisites

- Node.js ≥ 18 and npm
- MongoDB (local, Docker, Compass, or your VM instance)
- (Optional) Azure Active Directory / Entra ID tenant + Power BI Pro/Fabric workspace
- (Optional) Power BI Admin access (to enable service principal access for embed)

## 3) Environment Variables

Create two files (do **not** commit real secrets):

**`/hivemetrics-bridge/.env`** (backend)

```

**`/hive-matrix/.env.local`** ( frontend )


> Notes
> - CORS on the server permits `http://localhost:5173` and `http://127.0.0.1:5173` by default.
> - Keep secrets out of source control. Use environment‑specific `.env` files.

---

## 4) Quick Start ( process to run front end )

- open this hive-matrix file
- delete node_modules file from both hivemetrics-bridge and hive-matrix
- open new terminal go to hive-matrix using cd src/frontend/hive-matrix
- when you are in hive-matrix then run (npm install)
- again open new terminal go to hivemetrics-bridge using cd hivemetrics-bridge
- when you are in hivemetrics-bridge then run (npm install)
- and run  (npm run dev)
- now open new terminal and run ( npm run tw:watch)
- now go to hive-matrix and run ( npm run dev )
- you will see new link local: http://localhost:5173/ click on that it will take you to login page




-

## 5) Authentication: Current Mode vs MSAL

### 5.1 Current mode (MSAL disabled)
- **ON**: Demo login (`/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`).
- **OFF**: MSAL redirect. The “Sign in with Microsoft” button is visible but will only work once MSAL is configured.

To stay demo‑only:
- Keep using the email/password option on the `/login` page.

### 5.2 Enabling Microsoft Entra ID (MSAL) later (optional)

**A) Register a SPA app in Entra ID**

1. Go to Entra ID → **App registrations** → **New registration** → Name: `hivemetrics`
2. Supported account types: pick what you need (single tenant is simplest).
3. go to authentication and then in single page application
- type add URI http://localhost:5173/
- and in logout url type https://localhost:5173/login
4. After creation, note **Application (client) ID** and **Directory (tenant) ID**.
5. go to certificates and secrets add hive-pb and copy the value and add it in /hivemetrics-bridge/.env file
5. (Optional) If calling Graph/other APIs, add API permissions. For Power BI embed, the SPA doesn’t need extra delegated perms because we use a service principal on the backend to mint embed tokens.




## 6) Power BI Embedding (Service Principal)

We embed a report with a **service principal** (app‑only) and **embed token**.

### 6.1 Azure app for Power BI (server-side)
- open power bi fabric
- then go to workspaces,
- then create new workspaces.
- then open powerbi desktop , open report and publish it in your workspaces.
- now open powerbi fabric and go to workspaces you created and open the report.
- then you will see the url https://app.powerbi.com/groups/<WORKSPACE_ID>/reports/<REPORT_ID>/ReportSection
- copy the workspaces id ( groupid)
- copy the report id
- Now if you have not done it before than go to entra id , then app registration, new registration, any name is fine supposed account type single tenant, redirect uri, noe,
- After creation, copy,
- Directory (tenant id ) will be az tenant id
- Application (client id) will be az client id
- Certification and secrets – new client secret
- Copy the values now will be az client secret
- now allow service principlas in power bi ( tenant setting in fabric)
- developer setting- allow service principle to use power bi api's enable
- now grand permission in workspaces you created ( workspaces - access - add)
- search by app's name (service principal)
- role contributer or admin


### 6.2 Backend config
- Put these into `/backend/.env`:
```

AZ_TENANT_ID=<tenant>
AZ_CLIENT_ID=<app-client-id>
AZ_CLIENT_SECRET=<secret>
PBI_GROUP_ID=<workspace-guid>
PBI_REPORT_ID=<report-guid>

````

### 6.3 Frontend render
- The component `PowerBIReport` calls `/api/powerbi/embed-config`, then renders via `powerbi-client-react` using the returned `embedUrl + embed token`.
- Once configured, the Data Visuals and Location pages will show your real report .

---

## 7) API Reference (Mongo‑backed)

> Route prefix: `/v1/*`

### Health
- `GET /v1/health` → basic DB status, collections

### Locations
- `POST /v1/locations` → create a location (idempotent on unique identity)
```json
{ "name": "Lab A", "building": "ICT", "level": "1", "room": "A-104" }
````

- `GET /v1/locations/all` → list locations

### Nodes

- `POST /v1/nodes` → create a node (accepts `location_id` or a location object)
  ```json
  {
    "name": "Node A-01",
    "ip_address": "10.51.33.42",
    "mac_address": "AA:BB:CC:DD:EE:FF",
    "model": "ESP32 v3",
    "brand": "Murdoch IoT Lab",
    "location_id": "<ObjectId>",
    "is_poe_compatible": true,
    "is_wireless_connectivity": true,
    "ram_size": 512,
    "ram_unit": "MB",
    "storage_size": 16,
    "storage_unit": "GB",
    "storage_type": "microSD"
  }
  ```
- `PATCH /v1/nodes/:id` → update node (can switch location, still enforces one‑node‑per‑location)
- `DELETE /v1/nodes/:id` → remove node
- `GET /v1/nodes/count` → estimated count
- `GET /v1/nodes/summary` → `{ total, online, offline, windowMin }` using last event within 10 mins
- `GET /v1/nodes/all` → list nodes with computed `status` and `last_seen`

**Validation and constraints**

- IPv4 and MAC address formats are validated.
- Uniqueness: `name`, `ip_address`, `mac_address`.
- **One node per location** via unique index on `location_id` (partial) — prevents two nodes binding to the same location.
- **Unique location identity**: `(name, building, level, room)`.

---

## 8) Frontend Pages & Components

- **AuthProvider / ProtectedRoute**: guards routes, keeps `Authorization` header in sync, stores token in `sessionStorage`.
- **Dashboard**: KPI cards + sparkline + demo heatmap; “Online Nodes” reads `/v1/nodes/summary`.
- **Location**: filters mirror the URL (`?location=…&range=…`); **+ Add Location** modal.
- **Nodes**: table with live status pill, **+ Add Node** modal, delete action.

---

## 9) Common Tasks (Step‑by‑step)

### Add a new location

1. Go to **Location** → **+ Add Location**
2. Fill `Name` (+ optional building/level/room)
3. Submit → list refreshes

### Add a new node

1. Go to **Nodes** → **+ Add Node**
2. Fill fields (IP/MAC validated)
3. Choose an existing location (or leave unassigned)
4. Submit

### Delete a node

1. Nodes table → **Delete** → confirm

### Filter data on Location page

1. Choose `Location` and `Date range`
2. Click **Apply** (URL updates); **Reset** to default

---

## 10) Switching Between Demo Auth and MSAL

- **Stay in Demo**: Do nothing. Use the email/password login.
- **Turn on MSAL**:
  1. Complete **Entra ID SPA** registration
  2. Set frontend MSAL vars
  3. Use the **extended** backend (auth + powerbi) or add those endpoints to your server
  4. Restart both apps; click **“Sign in with Microsoft”**

> Tip: Keep both flows available for demos — if MSAL fails, use Demo quickly.

---

## 11) Deployment Notes

- Update `MONGODB_URI` to your VM or Atlas connection string.
- Ensure backend `PORT` is open and CORS allows your frontend origin.
- For HTTPS in prod, place Express behind Nginx/Apache/Cloud proxy with TLS.
- Power BI embed requires the backend to be reachable by the frontend to fetch the embed config.

## 13) Scripts (suggested)

**backend/package.json**

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```

**frontend/package.json**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 5173"
  }
}
```
