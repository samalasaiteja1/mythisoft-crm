# MYTHISOFT CRM

Production-ready MERN stack CRM for software companies — **MYTHISOFT INNOVATION PRIVATE LIMITED**.

## Structure

```
crm/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express + MongoDB API
├── uploads/         # Local file uploads (optional)
├── package.json     # Root scripts (dev, seed, build)
└── README.md
```

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full CRM + users, roles, settings |
| **Manager** | Leads, deals, projects, team performance |
| **Sales** | Assigned leads, follow-ups, deals, customers |
| **Tech** | Projects, tasks, deployments, bug fixes |
| **Support** | Customers, tickets, knowledge base |

## CRM Workflow

```
Admin → Lead Created → Manager Reviews → Assign to Sales → Follow-up
→ Qualified → Deal → Customer → Project → Tech Development
→ Testing → Deployment → Support → Ticket Resolution → Project Closed
```

## Quick Start

```bash
# Install dependencies
npm run install:all

# Seed database (5 demo users)
npm run seed

# Run client + server
npm run dev
```

- **Client:** http://localhost:5173
- **API:** http://localhost:5000/api

## Demo Logins

See **[DEMO_DATA.md](./DEMO_DATA.md)** for full org chart, teams, and sample data.

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mythisoft.com | admin123 |
| Sales Manager | manager@mythisoft.com | manager123 |
| Tech Manager | tech.manager@mythisoft.com | manager123 |
| Support Manager | support.manager@mythisoft.com | manager123 |
| Sales (Team Lead) | meera.sales@mythisoft.com | sales123 |
| Sales | rajesh@mythisoft.com | sales123 |
| Sales | arun.sales@mythisoft.com | sales123 |
| Tech (Team Lead) | technical@mythisoft.com | tech123 |
| Tech | deepak.tech@mythisoft.com | tech123 |
| Tech | rohit.tech@mythisoft.com | tech123 |
| Support (Team Lead) | support@mythisoft.com | support123 |
| Support | kavita.support@mythisoft.com | support123 |

## API Modules

```
POST   /api/auth/login
GET    /api/leads | POST | PUT | DELETE
GET    /api/deals | POST
GET    /api/customers | POST
GET    /api/projects | POST
GET    /api/tasks | POST
GET    /api/tickets | POST
GET    /api/users | POST
GET    /api/reports
```

## Environment

Copy `server/.env.example` to `server/.env` and set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`.

---

*Innovating Today, Empowering Tomorrow.*
