# 🛡️ Araksha — Smart Disaster Relief System

> **Araksha** (आरक्षा — Sanskrit for *Protection*) is a full-stack smart disaster relief management platform that connects **Admins**, **Volunteers**, and **Citizens** in real-time during emergencies. This repository contains the **Angular 21 frontend** application.

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Directory Layout](#directory-layout)
- [User Portals & Features](#user-portals--features)
- [Routing & Guards](#routing--guards)
- [Security & Session Flow](#security--session-flow)
- [Getting Started](#getting-started)
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
│                  Spring Boot 3.4 REST API                       │
│         JWT Auth  |  Spring Security  |  Spring Mail            │
├─────────────────────────────────────────────────────────────────┤
│                      MySQL Database                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Layout

```
src/
├── app/
│   ├── Admin/                 # Admin layouts, pages & components
│   │   ├── layouts/           # Admin shell with sidebar & navigation
│   │   └── pages/             # Triage, Live Map, Inventory, Scheduler
│   ├── Volunteers/            # Volunteer dashboard components
│   ├── citizen/               # Citizen dashboard portal (SOS, Needs, Aid)
│   ├── Common/                # Shared utilities & components
│   │   ├── landing-page/      # Public landing stats page
│   │   ├── login/ / signup/   # Auth registration panels
│   │   ├── models/            # TypeScript Interface definitions
│   │   ├── services/          # HTTP API Services (inventory, reports)
│   │   └── pipes/             # Direct pipes (findById)
│   ├── core/                  # Core guards, interceptors, services
│   │   ├── guards/            # Auth and Role route protection guards
│   │   └── interceptors/      # JWT token cookie injection
│   └── services/              # Core singleton services (maps, weather)
├── assets/                    # Static assets & icons
└── styles.css                 # TailwindCSS v4 global configurations
```

---

## User Portals & Features

### 🏛️ Admin Dashboard
- **Triage Center**: Real-time status list for managing incoming emergency request tickets.
- **Resource Allocation**: Direct tool to assign volunteers and supply kits to incidents.
- **Scheduler customizer**: Modifies database-persisted background jobs and cron expressions.
- **Live Field Map**: Leaflet routing to trace volunteer locations and active emergency sites.
- **Inventory Registry**: Logistics portal to track supplies, units, and low stock warnings.

### 🙋 Volunteer Hub
- **Active Task panel**: Navigation routes from current position to citizen coordinates.
- **Field updates**: Quick messaging dropdown to update dispatchers on travel status.
- **🚨 SOS Button**: Trigger danger state status to notify coordinates to admins.
- **Skill Matching**: Marks incident notifications that match volunteer credentials.

### 👤 Citizen Dashboard
- **SOS Dispatcher**: Quick emergency request creation tool.
- **🤝 Mutual Aid Board**: P2P local coordination board mapped by haversine distance.
- **Certified PDF Export**: Generates government-certified DMC receipts via jsPDF.

---

## Routing & Guards

The application enforces **role-based access control (RBAC)** using Angular route guards:

| Role | Route Prefix | Portal | Guard |
|---|---|---|---|
| **ADMIN** | `/dashboard`, `/volunteers` | Admin Shell | `authGuard` + `roleGuard` |
| **VOLUNTEER** | `/volunteerhub` | Volunteer Portal | `authGuard` + `roleGuard` |
| **CITIZEN** | `/citizen/dashboard` | Citizen Portal | `authGuard` + `roleGuard` |
| *(Public)* | `/LandingPage`, `/login` | Landing / Login | None |

---

## Security & Session Flow

- **HttpOnly Cookies**: Uses credentialed connections (`withCredentials: true`) to transmit JWT token cookies.
- **CSRF Token Handling**: Angular automatically maps the `XSRF-TOKEN` cookie to verify stateful POST, PUT, and DELETE requests.

---

## Getting Started

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

---

## External Integrations

- **Leaflet.js**: Tracking maps and routing vectors.
- **OpenWeatherMap API**: Live temperature and warning indexes.
- **Google Maps API**: Geocoding and reverse lookup services.
- **Twilio SMS**: Mobile dispatch triggers.
- **Chart.js**: Admin dashboard charts.
