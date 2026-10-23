# GoodRound

A subscription-driven web platform that combines golf performance tracking, charity fundraising, and a monthly draw-based reward engine.

**Live Demo:** https://goodround-src-delta.vercel.app/
**Repository:** https://github.com/harshajs816/GoodRound

Developed in response to the Digital Heroes Product Requirements Document (Level 1, 2026 Edition).

---

## Table of Contents

1. [Overview](#overview)
2. [Core Objectives](#core-objectives)
3. [User Roles](#user-roles)
4. [Features](#features)
5. [Prize Pool Logic](#prize-pool-logic)
6. [Tech Stack](#tech-stack)
7. [Architecture and Design Decisions](#architecture-and-design-decisions)
8. [Getting Started](#getting-started)
9. [Environment Variables](#environment-variables)
10. [Test Credentials](#test-credentials)
11. [Testing Checklist](#testing-checklist)
12. [Deployment](#deployment)
13. [Scalability Considerations](#scalability-considerations)
14. [Project Structure](#project-structure)
15. [Author](#author)

---

## Overview

GoodRound allows subscribers to record their latest golf scores in Stableford format, participate in monthly prize draws, and direct a portion of their subscription to a charity of their choice. Administrators manage users, draws, charities, winner verification, and reporting through a dedicated dashboard.

The interface is intentionally emotion-driven and led by charitable impact rather than traditional golf aesthetics.

## Core Objectives

| Area | Objective |
| --- | --- |
| Subscription | Robust monthly and yearly subscription and payment system |
| Score Entry | Simple, engaging score-entry flow |
| Draw Engine | Random or algorithm-based monthly draws |
| Charity | Seamless charity contribution logic |
| Admin | Comprehensive admin dashboard and tooling |
| UI/UX | Modern, distinctive interface that avoids golf clichés |

## User Roles

| Role | Capabilities |
| --- | --- |
| Public Visitor | View the platform concept, explore listed charities, understand draw mechanics, initiate a subscription |
| Registered Subscriber | Manage profile and settings, enter and edit scores, select a charity, view participation and winnings, upload winner proof |
| Administrator | Manage users and subscriptions, configure and run draws, manage charities, verify winners and payouts, access reports and analytics |

## Features

### Subscription and Payments
- Monthly and yearly plans, with a discounted yearly rate
- PCI-compliant payment processing (Stripe or equivalent)
- Restricted access for non-subscribers
- Handling of renewal, cancellation, and lapsed-subscription states
- Real-time subscription status validation on every authenticated request

### Score Management
- Users record their latest 5 golf scores
- Valid range: 1 to 45 (Stableford format); each score requires a date
- Only the 5 most recent scores are retained; a new score automatically replaces the oldest
- Scores are displayed in reverse chronological order
- One entry per date; duplicates are rejected and existing entries may only be edited or deleted

### Draw and Reward System
- Match tiers: 5-number, 4-number, and 3-number
- Draw logic: random (lottery-style) or algorithmic (weighted by score frequency)
- Monthly cadence with admin-controlled publishing
- Simulation mode prior to publishing results
- Jackpot rollover when the 5-number tier is unclaimed

### Charity System
- Charity selection at signup
- Minimum contribution of 10% of the subscription fee, adjustable upward by the user
- Independent donation option, not tied to gameplay
- Searchable and filterable charity directory
- Charity profiles with descriptions, images, and upcoming events
- Featured charity spotlight on the homepage

### Winner Verification
- Applies to winners only
- Winners upload a screenshot of their scores as proof
- Admins approve or reject submissions
- Payment status lifecycle: `Pending` to `Paid`

### User Dashboard
- Subscription status and renewal date
- Score entry and edit interface
- Selected charity and contribution percentage
- Participation summary (draws entered and upcoming draws)
- Winnings overview with total won and current payment status

### Admin Dashboard
- **User management:** view and edit profiles and golf scores; manage subscriptions
- **Draw management:** configure draw logic, run simulations, publish results
- **Charity management:** add, edit, and delete charities; manage content and media
- **Winners management:** review the winners list, verify submissions, mark payouts as completed
- **Reports and analytics:** total users, total prize pool, charity contribution totals, draw statistics

## Prize Pool Logic

A fixed portion of each subscription contributes to the prize pool. Tier allocations are calculated automatically from the active subscriber count.

| Match Type | Pool Share | Rollover |
| --- | --- | --- |
| 5-Number Match | 40% | Yes (jackpot) |
| 4-Number Match | 35% | No |
| 3-Number Match | 25% | No |

Prizes are split equally among multiple winners within the same tier.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | `[Specify, e.g. React / Next.js]` |
| Backend and Database | `[Specify, e.g. Supabase / PostgreSQL]` |
| Payments | `[Stripe or equivalent]` |
| Hosting | Vercel |

## Architecture and Design Decisions

- **Separation of concerns:** draw generation, prize calculation, and score logic are isolated from UI code to keep them testable.
- **Server-side enforcement:** subscription status, the 5-score rolling rule, and the one-score-per-date constraint are enforced on the backend, not only in the client.
- **Role-based access control:** visitor, subscriber, and admin routes are protected separately.
- **Auditable draws:** simulation results are kept distinct from published results to prevent accidental publication.

## Getting Started

### Prerequisites
- Node.js 18 or later
- npm or yarn
- A database project (for example, Supabase) and payment gateway keys

### Installation

```bash
git clone https://github.com/harshajs816/GoodRound.git
cd GoodRound
npm install
```

### Run Locally

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

## Environment Variables

Create a `.env` file in the project root. Variable names below are illustrative; adjust them to match the project configuration.

```env
# Database
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Never commit real credentials. Configure production values in the hosting provider's environment settings.

## Test Credentials

| Role | Email | Password |
| --- | --- | --- |
| Subscriber | `[add]` | `[add]` |
| Administrator | `[add]` | `[add]` |

## Testing Checklist

- [ ] User signup and login
- [ ] Subscription flow (monthly and yearly)
- [ ] Score entry with 5-score rolling logic
- [ ] Draw logic and simulation
- [ ] Charity selection and contribution calculation
- [ ] Winner verification flow and payout tracking
- [ ] User dashboard modules
- [ ] Admin panel functionality and usability
- [ ] Data accuracy across all modules
- [ ] Responsive design on mobile and desktop
- [ ] Error handling and edge cases

## Deployment

The application is deployed on Vercel with a dedicated backend project, with environment variables configured in the hosting dashboard.

Production URL: https://goodround-src-delta.vercel.app/

## Scalability Considerations

- Modular code structure with extensible data models
- Draw types and prize tiers defined through configuration so new variants can be added without rewriting core logic
- Database schema designed to support additional charities, plans, and draw formats

## Project Structure

```
GoodRound/
├── src/
├── public/
├── package.json
└── README.md
```

## Author

**Harsh**
GitHub: [@harshajs816](https://github.com/harshajs816)

## Acknowledgements

Product requirements provided by [Digital Heroes](https://digitalheroes.co.in) (PRD Level 1, 2026 Edition).
