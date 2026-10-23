# ⛳ GoodRound

### Play Golf. Make an Impact.

**GoodRound** is a subscription-driven golf and charity platform that combines golf score tracking, charitable contributions, and a monthly draw-based reward system in one experience.

<p align="center">
  <a href="https://goodround-src-delta.vercel.app/">
    <img src="https://img.shields.io/badge/Live%20Demo-Visit%20GoodRound-15803D?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <a href="https://github.com/harshajs816/GoodRound">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repository" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-Frontend-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-API-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
</p>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Core Objectives](#-core-objectives)
- [User Roles](#-user-roles)
- [Features](#-features)
- [Prize Pool Logic](#-prize-pool-logic)
- [Technology Stack](#-technology-stack)
- [Architecture and Design Decisions](#-architecture-and-design-decisions)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Testing Checklist](#-testing-checklist)
- [Deployment](#-deployment)
- [Scalability and Future Improvements](#-scalability-and-future-improvements)
- [Project Structure](#-project-structure)
- [Author](#-author)

---

## 🌟 Overview

GoodRound explores how golf participation can create a meaningful charitable impact.

The platform brings together golf score management, membership plans, charity preferences, and draw-based rewards. Members can manage their profiles, record scores, explore charities, and review their membership information, while administrators have dedicated tools for managing users, charities, subscriptions, draws, and winners.

The product experience emphasizes **community impact, simplicity, and engagement** rather than traditional golf-focused aesthetics.

### 🎯 Core Objectives

| Area | Objective |
|---|---|
| Memberships | Support monthly and yearly membership plans |
| Golf Scoring | Provide a straightforward score-entry and history experience |
| Draw System | Organize draw-related functionality and prize tiers |
| Charity | Connect membership participation with charitable contributions |
| Administration | Provide management tools for platform operations |
| User Experience | Deliver a modern, responsive, impact-focused interface |

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| **Public Visitor** | Explore the platform and discover listed charities |
| **Member** | Manage their profile, golf scores, charity preferences, and membership |
| **Administrator** | Manage users, charities, subscriptions, draws, and winner records |

## ✨ Features

### 🏌️ Member Experience

- **Authentication:** Register and log in with protected account access.
- **Golf Score Management:** Record golf scores and review score history.
- **Charity Discovery:** Browse charities and access available charity information.
- **Membership Plans:** View monthly and yearly membership options.
- **Charity Preferences:** Configure charity selection and contribution preferences.
- **Member Dashboard:** Access membership information and relevant account features.
- **Draw Experience:** Explore draw information and related reward functionality.

### 💳 Memberships and Payments

- Monthly and yearly membership plans.
- Backend subscription and membership management.
- Razorpay payment integration in the backend.
- Payment-order creation and payment-verification routes.
- Membership-related data managed through the application database.

> Payment-provider configuration and the complete renewal or cancellation lifecycle should be verified in the deployed environment before being presented as production-ready.

### 🎁 Draw and Reward System

The platform includes draw-related functionality and data models for draw entries and winning records.

- Draw management through administrative routes.
- Draw entries and winner records.
- Prize-tier concepts for different match categories.
- Winner payout-status tracking in the database model.

### 💚 Charity Management

- Browse available charities.
- Access charity descriptions and available media.
- Manage charity records through administrative functionality.
- Associate member preferences with charitable giving.

### 🛡️ Administration

- **User Management:** Manage user records.
- **Charity Management:** Maintain charity information.
- **Subscription Management:** Access subscription-related records.
- **Draw Management:** Manage draw-related operations.
- **Winner Management:** Review winner records and payout status.

## 🏆 Prize Pool Logic

The proposed prize allocation model distributes the prize pool across three match tiers.

| Match Tier | Proposed Pool Share | Jackpot Rollover |
|---|---:|---|
| 5-Number Match | 40% | Yes |
| 4-Number Match | 35% | No |
| 3-Number Match | 25% | No |
| **Total** | **100%** | — |

Under this model, the prize pool is divided into tier-specific allocations, with rollover intended for an unclaimed 5-number jackpot.

*Note: These percentages describe the intended prize model. Confirm the implementation and applicable rules before using them for actual payouts.*

## 🧰 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19 | Component-based user interface |
| Build Tool | Vite | Development server and production builds |
| Styling | Tailwind CSS 4 | Responsive UI styling |
| Routing | React Router | Client-side navigation |
| API Client | Axios | Frontend-to-backend communication |
| Data Fetching | TanStack Query | Server-state management |
| Backend | Node.js and Express 5 | REST API and server-side logic |
| Database | PostgreSQL | Persistent application data |
| ORM | Prisma | Database schema and data access |
| Authentication | JWT and bcryptjs | Token-based authentication and password hashing |
| Payments | Razorpay | Payment-related backend integration |
| Frontend Hosting | Vercel | Deployed web application |

## 🏗️ Architecture and Design Decisions

GoodRound follows a separated frontend-and-backend architecture.

- **Separation of Concerns:** UI components, API routes, controllers, and database access are organized into distinct areas.
- **Backend Authentication:** Authentication logic is handled by the API, with protected endpoints for authenticated operations.
- **Database Abstraction:** Prisma provides a structured interface to PostgreSQL.
- **Modular API:** Authentication, golf scores, charities, subscriptions, payments, administration, and draws have separate route groups.
- **Environment-Based Configuration:** API URLs and sensitive server configuration are supplied through environment variables.

## 🚀 Getting Started

Follow these steps to run GoodRound locally.

### Prerequisites

- Node.js and npm
- PostgreSQL database
- Git
- Razorpay test credentials if testing payment functionality

### 1. Clone the Repository

```bash
git clone https://github.com/harshajs816/GoodRound.git
cd GoodRound
```

### 2. Install Frontend Dependencies

Run this command from the repository root:

```bash
npm install
```

### 3. Configure the Frontend

Create a `.env` file in the repository root:

```env
VITE_API_URL=http://localhost:5000/api
```

Set this variable to your deployed backend API URL when using the deployed application.

### 4. Install Backend Dependencies

```bash
cd backend
npm install
```

### 5. Configure the Backend

Create a `backend/.env` file:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET=replace_with_a_secure_random_secret
ADMIN_PASSWORD=replace_with_a_secure_admin_password
```

Configure the values for your own environment. Add any additional payment credentials required by the backend payment implementation.

**Never commit real secrets or production credentials.**

### 6. Prepare the Database

From the `backend` directory:

```bash
npx prisma generate
npx prisma db push
```

These commands generate the Prisma client and synchronize the Prisma schema with your development database. Review the database state before applying schema changes to an existing database.

### 7. Seed Initial Data

```bash
npm run seed
```

The seed script initializes membership plans and the administrator account using the configured environment.

### 8. Start the Backend

```bash
npm run dev
```

The backend uses port `5000` by default.

### 9. Start the Frontend

Open another terminal at the repository root:

```bash
npm run dev
```

Open the local URL shown in the Vite terminal output.

### 10. Create a Production Build

From the repository root:

```bash
npm run build
```

To preview the generated production build:

```bash
npm run preview
```

## 🔐 Environment Configuration

| Variable | Location | Purpose |
|---|---|---|
| `VITE_API_URL` | Root `.env` | Backend API base URL |
| `PORT` | `backend/.env` | Backend server port |
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string |
| `JWT_SECRET` | `backend/.env` | JWT signing secret |
| `ADMIN_PASSWORD` | `backend/.env` | Administrator seed configuration |

Payment credentials may also be required by the payment integration. Refer to the backend implementation for the exact variable names.

For production, configure environment variables in the relevant hosting provider rather than committing `.env` files.

## 🧪 Testing Checklist

Use this checklist when validating the application locally or after deployment.

- [ ] User registration and login
- [ ] Authentication and protected routes
- [ ] Golf score creation and history
- [ ] Charity listing and preferences
- [ ] Membership plan display
- [ ] Payment order creation and verification
- [ ] Draw and winner-related operations
- [ ] Administrator access and management routes
- [ ] Database persistence and error handling
- [ ] Responsive layout on mobile and desktop
- [ ] Production API connectivity and CORS configuration

## ☁️ Deployment

### Live Application

**[Open GoodRound →](https://goodround-src-delta.vercel.app/)**

### Deployment Configuration

For your own deployment:

1. Deploy the frontend to Vercel.
2. Deploy the backend as a Node.js service.
3. Provision a PostgreSQL database.
4. Configure `DATABASE_URL`, `JWT_SECRET`, and other required server environment variables.
5. Set `VITE_API_URL` to the deployed API base URL ending in `/api`.
6. Configure CORS to allow requests from the frontend domain.
7. Test registration, login, database connectivity, and payment flows after deployment.

## 📈 Scalability and Future Improvements

Potential next steps for the project include:

- Automated backend and frontend tests.
- API documentation with request and response examples.
- More comprehensive subscription lifecycle handling.
- Improved draw auditing and result-verification workflows.
- Monitoring, structured logging, and production error reporting.
- Expanded reporting and analytics for platform administrators.
- Accessibility improvements and end-to-end testing.

## 📂 Project Structure

```text
GoodRound/
├── backend/
│   ├── controllers/
│   ├── lib/
│   ├── middleware/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── routes/
│   ├── package.json
│   └── server.js
├── src/
│   ├── Components/
│   ├── Pages/
│   ├── context/
│   ├── lib/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

## 👨‍💻 Author

**Harsh Yadav**

Full Stack Developer | Computer Science Engineering Student

- **GitHub:** [@harshajs816](https://github.com/harshajs816)
- **Project:** [GoodRound Repository](https://github.com/harshajs816/GoodRound)
- **Live Demo:** [goodround-src-delta.vercel.app](https://goodround-src-delta.vercel.app/)

## 🙌 Acknowledgements

Project developed in response to the **Digital Heroes Product Requirements Document — Level 1, 2026 Edition**.

---

<p align="center">
  <strong>GoodRound — Your Game. Your Impact.</strong>
  <br />
  <sub>Building a connection between golf, community, and charitable giving.</sub>
</p>
