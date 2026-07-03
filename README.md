# 🛡️ Araksha — Smart Disaster Relief System

> **Araksha** (आरक्षा — Sanskrit for *Protection*) is a full-stack smart disaster relief management platform that connects **Admins**, **Volunteers**, and **Citizens** in real time during emergencies. This repository contains the **Angular frontend** application.

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [User Roles & Access](#user-roles--access)
- [Routing](#routing)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Backend Integration](#backend-integration)
- [API Services](#api-services)
- [Build & Deployment](#build--deployment)
- [External Integrations](#external-integrations)

---

## Overview

Araksha is a comprehensive disaster relief coordination platform designed to streamline emergency response operations. It provides a unified interface for administrators to manage resources, volunteers to receive tasks, and citizens to report emergencies and request assistance.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Araksha Platform                         │
├──────────────────┬──────────────────┬───────────────────────────┤
│   Admin Portal   │  Volunteer Hub   │     Citizen Dashboard     │
│  (Angular SPA)   │  (Angular SPA)   │      (Angular SPA)        │
├──────────────────┴──────────────────┴───────────────────────────┤
│                     Angular 21 Frontend                         │
│           TailwindCSS v4  |  Chart.js  |  Leaflet Maps          │
├─────────────────────────────────────────────────────────────────┤
│                  Spring Boot 4.1 REST API                       │
│         JWT Auth  |  Spring Security  |  Spring Mail            │
├─────────────────────────────────────────────────────────────────┤
│                      MySQL Database                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

### 🏛️ Admin Dashboard

| Feature | Description |
|---|---|
| **Dashboard** | Real-time KPIs, charts, and incident overview |
| **Emergency Requests** | View, triage, and manage incoming emergencies |
| **Volunteer Management** | Assign, track, and monitor volunteer performance |
| **Shelter Management** | Manage shelter capacities and availability |
| **Inventory Control** | Track relief supplies and stock levels |
| **Resource Allocation** | Assign supplies and volunteers to incidents |
| **Live Tracking** | Real-time map view of field operations (Leaflet) |
| **Notifications** | Broadcast alerts and updates to users |
| **Reports** | Generate and schedule incident/resource reports |
| **Scheduler** | Automate recurring relief tasks and alerts |
| **Settings** | System-wide configuration management |

### 🙋 Volunteer Hub

| Feature | Description |
|---|---|
| **Volunteer Dashboard** | View assigned tasks, notifications, and status |
| **Task Management** | Accept/reject tasks, mark completions |
| **Mutual Aid** | Post and browse mutual aid listings |

### 👤 Citizen Portal

| Feature | Description |
|---|---|
| **Emergency SOS** | Submit emergency requests with location |
| **Need Reporting** | Report specific needs (food, water, medical) |
| **Mutual Aid** | Post offers or requests for community help |
| **Status Tracking** | Track the status of submitted requests |
| **Notifications** | Receive updates from relief coordinators |

### 🔑 Authentication Flow

| Feature | Description |
|---|---|
| **Signup** | Role-based account registration |
| **Login** | JWT-based secure login |
| **Forgot Password** | Email OTP-based password reset flow |
| **OTP Verification** | Verify identity via emailed OTP |
| **Reset Password** | Secure password reset after OTP verification |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Angular | ^21.2.0 |
| **Language** | TypeScript | ~5.9.2 |
| **Styling** | TailwindCSS | ^4.1.12 |
| **CSS Processing** | PostCSS | ^8.5.3 |
| **Charts** | Chart.js + ng2-charts | ^4.5.1 / ^10.0.0 |
| **Maps** | Leaflet.js | 1.9.4 (CDN) |
| **Icons** | Font Awesome | ^7.2.0 |
| **HTTP Client** | Angular HttpClient + RxJS | ~7.8.0 |
| **Testing** | Vitest + jsdom | ^4.0.8 / ^28.0.0 |
| **Code Format** | Prettier | ^3.8.1 |
| **Package Manager** | npm | 11.6.2 |

---

## Project Structure

```
src/
├── app/
│   ├── Admin/
│   │   └── Componet/
│   │       ├── layouts/
│   │       │   └── admin-layout/              # Admin shell with sidebar & nav
│   │       └── pages/
│   │           ├── dashboard/                 # Admin home — KPIs & charts
│   │           ├── emergency-requests.component/  # Emergency triage board
│   │           ├── volunteers.component/      # Volunteer management
│   │           ├── shelters/                  # Shelter registry
│   │           ├── inventory/                 # Supply inventory
│   │           ├── allocation/                # Resource allocation
│   │           ├── live-tracking/             # Leaflet-powered live map
│   │           ├── notifications/             # Notification center
│   │           ├── reports/                   # Report generation
│   │           ├── scheduler/                 # Job scheduler UI
│   │           └── settings/                  # System settings
│   │
│   ├── Volunteers/
│   │   └── Component/
│   │       └── volunteer-dashboard/           # Volunteer portal
│   │
│   ├── citizen/
│   │   └── citizen.ts / citizen.html          # Citizen portal (SOS, needs, aid)
│   │
│   ├── Common/
│   │   ├── landing-page/                      # Public landing page
│   │   ├── login/                             # Login page
│   │   ├── signup/                            # Registration page
│   │   ├── forgot-password/                   # Password recovery
│   │   ├── verify-otp/                        # OTP verification
│   │   ├── reset-password/                    # Password reset
│   │   ├── models/                            # TypeScript interfaces/models
│   │   │   ├── emergency-request.model.ts
│   │   │   ├── shelter.model.ts
│   │   │   ├── volunteer.model.ts
│   │   │   ├── citizen.ts
│   │   │   ├── settings.model.ts
│   │   │   ├── admin-dashboard.model.ts
│   │   │   └── landing-stats.model.ts
│   │   ├── services/                          # Shared HTTP services
│   │   ├── icon/                              # Custom icon components
│   │   └── toggle/                            # UI toggle components
│   │
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts                  # Protects authenticated routes
│   │   │   └── role.guard.ts                  # Enforces role-based access
│   │   ├── interceptors/                      # HTTP interceptors (JWT injection)
│   │   └── service/                           # Core singleton services
│   │
│   ├── services/
│   │   ├── dashboard.ts                       # Admin dashboard data service
│   │   ├── shelter.ts                         # Shelter CRUD service
│   │   ├── maps.service.ts                    # Google Maps / Leaflet service
│   │   ├── weather.service.ts                 # OpenWeatherMap service
│   │   └── notification-sender.service.ts     # Push notification service
│   │
│   ├── environments/                          # Environment configs (dev/prod)
│   ├── app.routes.ts                          # Central routing configuration
│   ├── app.config.ts                          # App-level providers & config
│   └── app.ts                                 # Root application component
│
├── assets/                                    # Static assets (images, icons)
├── index.html                                 # HTML entry point
├── main.ts                                    # Angular bootstrap
└── styles.css                                 # Global styles entry
```

---

## User Roles & Access

The application enforces **role-based access control (RBAC)** using Angular route guards.

| Role | Route Prefix | Portal | Guard |
|---|---|---|---|
| **ADMIN** | `/dashboard`, `/emergency-requests`, etc. | Admin Layout | `authGuard` + `roleGuard` |
| **VOLUNTEER** | `/volunteerhub` | Volunteer Dashboard | `authGuard` + `roleGuard` |
| **CITIZEN** | `/citizen/dashboard` | Citizen Portal | `authGuard` + `roleGuard` |
| *(Public)* | `/LandingPage`, `/login`, `/signup`, etc. | Public Pages | None |

---

## Routing

```
/                         → redirects to /LandingPage
/LandingPage              → Public landing page
/login                    → Login
/signup                   → Registration
/forgot-password          → Password recovery initiation
/verify-otp               → OTP entry
/reset-password           → New password entry

[ADMIN - protected]
/dashboard                → Admin Dashboard
/emergency-requests       → Emergency Request Board
/volunteers               → Volunteer Management
/shelters                 → Shelter Registry
/inventory                → Inventory Management
/allocation               → Resource Allocation
/live-tracking            → Live Field Map
/notifications            → Notification Center
/reports                  → Reports & Analytics
/scheduler                → Job Scheduler
/settings                 → System Settings

[VOLUNTEER - protected]
/volunteerhub             → Volunteer Dashboard

[CITIZEN - protected]
/citizen/dashboard        → Citizen Portal
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18.x |
| npm | ≥ 11.x |
| Angular CLI | ≥ 21.x |

### Installation

```bash
# Clone the repository
git clone https://github.com/Ravindu387/Araksha-smart-disaster-relief-frontend.git
cd Araksha-smart-disaster-relief-frontend

# Install dependencies
npm install

# Start development server
npm start
```

The app will be available at **http://localhost:4200**.

### Available Scripts

| Script | Command | Description |
|---|---|---|
| `start` | `ng serve` | Start dev server with live reload |
| `build` | `ng build` | Build production bundle |
| `watch` | `ng build --watch` | Rebuild on file changes |
| `test` | `ng test` | Run unit tests via Vitest |

---

## Environment Configuration

Edit the environment files in `src/app/environments/`:

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
};
```

---

## Backend Integration

This frontend communicates with the **Araksha Spring Boot Backend**.

| Setting | Value |
|---|---|
| Backend URL | `http://localhost:8080` |
| API Base Path | `/api/**` |
| Auth Type | JWT (Bearer Token) |
| Token Storage | LocalStorage / SessionStorage |

> 📌 Make sure the backend server is running before starting the frontend.

The backend requires the following environment variables to be set:

| Variable | Description |
|---|---|
| `GMAIL_USERNAME` | Gmail address for OTP emails |
| `GMAIL_PASSWORD` | Google App Password (not your Gmail password) |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key |
| `OPENWEATHERMAP_API_KEY` | OpenWeatherMap API key |
| `TWILIO_ACCOUNT_SID` | Twilio account SID for SMS alerts |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token |
| `TWILIO_PHONE_NUMBER` | Twilio outbound phone number |
| `ARAKSHA_ADMIN_EMAIL` | Default system admin email |

---

## API Services

The frontend integrates with the following backend REST controllers:

| Service | Endpoint Area | Purpose |
|---|---|---|
| `AuthController` | `/api/auth/**` | Login, signup, OTP, password reset |
| `AdminDashboardController` | `/api/admin/**` | Admin KPIs and stats |
| `EmergencyRequestController` | `/api/emergency-requests/**` | Emergency CRUD & triage |
| `VolunteerController` | `/api/volunteers/**` | Volunteer management |
| `ShelterController` | `/api/shelters/**` | Shelter CRUD |
| `InventoryController` | `/api/inventory/**` | Supply inventory |
| `AllocationController` | `/api/allocations/**` | Resource allocation |
| `NotificationController` | `/api/notifications/**` | System notifications |
| `ReportsController` | `/api/reports/**` | Report generation |
| `SchedulerController` | `/api/scheduler/**` | Job scheduling |
| `CitizenController` | `/api/citizen/**` | Citizen portal operations |
| `VolunteerHubController` | `/api/volunteerhub/**` | Volunteer task operations |
| `ExternalApiController` | `/api/external/**` | Maps, Weather, Twilio SMS |
| `FileController` | `/api/files/**` | File upload/download |
| `LandingPageController` | `/api/landing/**` | Public landing page stats |

---

## Build & Deployment

### Production Build

```bash
npm run build
```

Output is generated in the `dist/` directory.

### AWS CodeBuild (CI/CD)

The project includes a `buildspec.yml` for AWS CodeBuild integration:

```yaml
# buildspec.yml — automated AWS CodeBuild pipeline
phases:
  install:   npm install
  build:     npm run build
artifacts:   dist/
```

---

## 🗺️ External Integrations

| Integration | Usage |
|---|---|
| **Leaflet.js** | Interactive real-time tracking maps |
| **OpenWeatherMap API** | Weather data for disaster risk assessment |
| **Google Maps API** | Geocoding and location services |
| **Twilio SMS API** | Emergency SMS alerts to citizens/volunteers |
| **Gmail SMTP** | OTP and notification emails via Spring Mail |
| **Font Awesome** | UI icon library |
| **Chart.js** | Dashboard analytics and reporting charts |

---

## 📄 License

This project is developed as part of the Araksha disaster relief initiative.

---

> Built with ❤️ to protect communities when it matters most.
