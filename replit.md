# Attendance Management System - Electron + React Desktop Application

## Overview
A comprehensive desktop attendance tracking application built with Electron and React. The application provides employee time tracking, activity monitoring, screenshot capture, and admin management features. It connects to a backend API running on http://localhost:3000.

## Project Status
- **Current State**: MVP implementation complete with React UI running on Vite dev server
- **Last Updated**: November 18, 2025
- **Stack**: Electron 28, React 18, Vite 5, Tailwind CSS 3, Node.js 20

## Architecture

### Frontend (React + Vite)
- **Port**: 5000 (configured for Replit webview)
- **Build Tool**: Vite with React plugin
- **Styling**: Tailwind CSS with PostCSS
- **State Management**: React hooks (useAuth, useAttendance)
- **Routing**: React Router v6

### Desktop (Electron)
- **Main Process**: electron/main.js - handles app lifecycle, IPC, system tray, background services
- **Preload Script**: electron/preload.js - secure IPC bridge with contextBridge
- **Services**: Screenshot capture, activity heartbeat, idle detection

### Pages & Features
1. **Login** (`/`) - JWT authentication with backend
2. **Dashboard** (`/dashboard`) - Real-time attendance status, Mark In/Out, Lunch tracking
3. **Screenshots** (`/screenshots`) - Activity screenshot gallery with date filtering
4. **History** (`/history`) - Attendance history with date range filtering
5. **Settings** (`/settings`) - Configure auto-start, notifications, intervals
6. **Admin Dashboard** (`/admin`) - Team overview, employee status monitoring (admin only)
7. **Employee Management** (`/admin/employees`) - CRUD operations for employees (admin only)
8. **Reports** (`/admin/reports`) - Productivity reports with charts and CSV export (admin only)

## Backend API Integration

### Base URL
`http://localhost:3000`

### Authentication
- **Login**: `POST /api/auth/login` - Returns JWT token
- **Logout**: `POST /api/auth/logout`
- **Current User**: `GET /api/auth/me`

### Demo Credentials
- Admin: `admin@company.com` / `employee123`
- Employee: `john.doe@company.com` / `employee123`

### Attendance Endpoints
- `POST /api/attendance/check-in` - Mark employee as checked in
- `POST /api/attendance/check-out` - Mark employee as checked out
- `GET /api/attendance/today` - Get today's attendance data
- `GET /api/attendance/history?start_date=&end_date=` - Get attendance history

### Lunch Break
- `POST /api/lunch-break/start` - Start lunch break
- `POST /api/lunch-break/end` - End lunch break
- `GET /api/lunch-break/current` - Get current lunch break status

### Activity Tracking
- `POST /api/activity/heartbeat` - Send activity heartbeat (every 30s)
- `GET /api/activity/current` - Get current activity status

### Screenshots
- `POST /api/screenshots/upload` - Upload screenshot
- `GET /api/screenshots/list?date=&user_id=` - List screenshots
- `DELETE /api/screenshots/:id` - Delete screenshot

### Admin Endpoints
- `GET /api/users` - List all employees
- `POST /api/users` - Create new employee
- `GET /api/reports/daily?date=&user_id=` - Daily report
- `GET /api/reports/weekly?start_date=&user_id=` - Weekly report
- `GET /api/reports/team-overview?date=` - Team overview

## Key Features Implemented

### Electron Features
- ✅ Auto-start on system boot (`app.setLoginItemSettings`)
- ✅ Auto check-in prompt on startup for logged-in users
- ✅ Auto check-out on app shutdown
- ✅ System tray integration with status indicators
- ✅ Background services (screenshot capture, activity heartbeat, idle detection)
- ✅ IPC communication between main and renderer processes
- ✅ Persistent storage with electron-store

### React Features
- ✅ JWT authentication with secure token management
- ✅ Protected routes based on authentication and role
- ✅ Real-time status updates (Active/Idle)
- ✅ Conditional button states based on attendance status
- ✅ Admin-only pages with role-based access
- ✅ Responsive UI with Tailwind CSS
- ✅ Date pickers and filtering
- ✅ Charts and visualizations (Recharts)

### Background Services
- **Screenshot Capture**: Every 10 minutes (configurable: 5, 10, 15, 30)
- **Activity Heartbeat**: Every 30 seconds with idle time tracking
- **Idle Detection**: Monitors system idle time, alerts after 5 minutes (configurable: 3, 5, 10, 15)

## Running the Application

### Development Mode

#### React UI Only (Web Testing)
```bash
npm run dev
```
Runs Vite dev server on http://localhost:5000

#### Full Electron App
```bash
npm run electron:dev
```
Runs both Vite and Electron concurrently

### Building for Production
```bash
npm run dist
```
Builds the app for Windows, Mac, and Linux using electron-builder

## Project Structure
```
attendance-app/
├── electron/
│   ├── main.js                 # Electron main process
│   ├── preload.js              # IPC bridge
│   └── services/               # Background services (placeholder)
├── src/                        # React application
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Main app with routing
│   ├── index.css               # Tailwind imports
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Screenshots.jsx
│   │   ├── History.jsx
│   │   ├── Settings.jsx
│   │   └── admin/
│   │       ├── AdminDashboard.jsx
│   │       ├── EmployeeManagement.jsx
│   │       └── Reports.jsx
│   ├── components/
│   │   └── Navbar.jsx
│   ├── services/
│   │   ├── api.js              # Axios client
│   │   └── auth.js             # Auth service
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useAttendance.js
│   └── utils/
│       └── formatTime.js
├── public/
│   └── icon.png               # Tray icon
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Dependencies

### Production
- `axios` - HTTP client
- `date-fns` - Date formatting
- `electron-store` - Persistent storage
- `lucide-react` - Icons
- `react`, `react-dom` - UI framework
- `react-router-dom` - Routing
- `recharts` - Charts

### Development
- `electron` - Desktop framework
- `electron-builder` - Packaging
- `vite` - Build tool
- `@vitejs/plugin-react` - React support
- `tailwindcss` - CSS framework
- `concurrently` - Run multiple commands
- `wait-on` - Wait for server

## Known Limitations
- Screenshot capture uses placeholder implementation (requires `screenshot-desktop` library setup)
- Activity window tracking simplified (requires `active-win` library)
- Mouse/keyboard event tracking not implemented (requires `iohook` library)
- Icon file is placeholder text (needs actual PNG icon)

## Recent Changes
- **2025-11-18**: Initial project setup with all MVP features
  - Created Electron main process with auto-start and shutdown handlers
  - Implemented React UI with all pages (Login, Dashboard, Screenshots, History, Settings, Admin)
  - Set up API client with dynamic baseURL and token management
  - Configured Vite to bind to 0.0.0.0:5000 for Replit compatibility
  - Added background services for heartbeat and idle detection
  - Implemented system tray integration

## User Preferences
- None specified yet

## Notes
- Backend API must be running on http://localhost:3000 for the app to function
- For full Electron testing, use `npm run electron:dev`
- Current Replit setup runs React UI only via `npm run dev` on port 5000
- Admin features require logging in with admin credentials
