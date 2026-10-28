# BIT Centralized Vehicle Fleet Booking Portal

> Centralized Vehicle Fleet Booking Portal for Faculty Official Visits and Field Trips.

A comprehensive full-stack platform designed to streamline vehicle requests, approvals, fleet allocations, driver dispatch, trip tracking, and reporting for institutional visits and academic field trips.

---

## 🚀 Key Features

- **Role-Based Access Control (RBAC):**
  - **Faculty:** Submit vehicle requests with purpose, passenger count, itinerary, and schedule; track live status and driver details.
  - **Head of Department (HOD):** Review, recommend, approve, or reject department faculty vehicle requests.
  - **Transport Officer / Admin:** Allocate vehicles and drivers, monitor fleet availability, manage maintenance, and handle logistics.
  - **Driver:** View assigned trips, start/complete journeys, track routes, and log odometer/fuel updates.
  - **Super Admin:** Full platform audit trail, user management, and advanced analytics.

- **Intelligent Fleet Management & Allocation:**
  - Real-time vehicle availability tracking.
  - Conflict detection to prevent double-booking.
  - Vehicle types supported: Buses, Vans, SUVs, Sedans.

- **Route & Trip Visualization:**
  - Interactive map routing powered by Leaflet and OpenStreetMap.
  - Trip route visualization and distance estimation.

- **Automated Notifications & Reports:**
  - In-app notification center and email notifications for status transitions.
  - Exportable reports (Excel / PDF) for audits and administrative logs.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 (Vite)
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Mapping:** Leaflet & React-Leaflet
- **Charts:** Recharts
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js & Express.js
- **ORM / Database:** Prisma ORM (MongoDB / PostgreSQL / SQLite support)
- **Authentication:** JWT (JSON Web Tokens) & Bcrypt
- **Document Export:** PDFKit & SheetJS (XLSX)
- **Mailing:** Nodemailer

---

## 📂 Project Structure

```
├── client/                 # React frontend application (Vite)
│   ├── public/             # Static public assets
│   ├── src/
│   │   ├── components/     # Reusable UI components & maps
│   │   ├── context/        # Auth & State contexts
│   │   ├── layouts/        # Dashboard layout shells
│   │   ├── pages/          # Role-based dashboard & views
│   │   ├── services/       # API and map service integrations
│   │   └── utils/          # Constants and helper utilities
│   └── vite.config.js
├── server/                 # Express.js REST API backend
│   ├── src/
│   │   ├── config/         # Database and server configuration
│   │   ├── controllers/    # API endpoint controllers
│   │   ├── middleware/     # Auth and error middleware
│   │   ├── routes/         # Express API route definitions
│   │   ├── services/       # Notification, audit & email services
│   │   └── utils/          # ID generators and utilities
├── prisma/                 # Database schema definitions & seed scripts
│   ├── schema.prisma       # Active Prisma schema
│   ├── seed.js             # Seed script for initial test data
│   └── migrate-to-mongo.js # Data migration utility
├── .env.example            # Environment variables template
└── package.json            # Root workspace scripts
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- MongoDB / PostgreSQL database instance (or SQLite for local development)

### 2. Installation

Clone the repository and install dependencies:
```bash
git clone https://github.com/logesh2046/BIT-CENTRALIZED-VEHICLE-FLEET-BOOKING-PORTAL-FOR-FACULTY-OFFICIAL-VISITS-AND-FIELD-TRIPS.git
cd BIT-CENTRALIZED-VEHICLE-FLEET-BOOKING-PORTAL-FOR-FACULTY-OFFICIAL-VISITS-AND-FIELD-TRIPS

# Install root, client, and server dependencies
npm install
npm install --prefix client
npm install --prefix server
```

### 3. Environment Configuration

Copy `.env.example` to `.env` in both the root/server directory:
```bash
cp .env.example server/.env
```

Configure your environment variables in `server/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="your-database-connection-string"
JWT_SECRET="your-secure-jwt-secret"
CLIENT_URL="http://localhost:5173"
```

### 4. Database Setup & Seeding

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# (Optional) Seed initial demo data
npm run prisma:seed
```

### 5. Running the Application

Run both frontend and backend concurrently or in separate terminals:

```bash
# Start backend server (Port 5000)
npm run dev:server

# Start frontend development server (Port 5173)
npm run dev:client
```

Visit `http://localhost:5173` to access the portal.

---

## 🔒 Security & Privacy

- `.env` files containing database credentials and secret keys are excluded from version control.
- Passwords are encrypted using bcrypt hashing.
- Role-based route guards protect both frontend navigation and backend API endpoints.

---

## 📄 License

This project is licensed under the MIT License.
