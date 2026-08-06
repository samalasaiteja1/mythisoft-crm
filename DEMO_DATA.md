# MYTHISOFT CRM — Demo Sample Data

Run `npm run seed` to load all sample data below. Optional: `npm run seed:examples` for extra tagged leads/deals/follow-ups.

**App URL:** http://localhost:5173

---

## Lead workflow (Admin → Sales Manager → Sales Executive)

```
Admin
   │
   ▼
Create Lead
   │
   ▼
Assign to Sales Manager (Priya Sharma)
   │
   ▼
Sales Manager
   │
   ▼
Assign to Sales Executive (Rajesh / Meera / Arun)
```

### Sample leads after `npm run seed`

| Lead | Company | Sales Manager | Sales Executive | Use case |
|------|---------|---------------|-----------------|----------|
| **LD-00001** Amit Sharma | TechCorp India | — | — | **Unassigned** — admin queue |
| **LD-00002** Priya Patel | MedLife Systems | Priya Sharma | — | **Manager only** — manager assigns sales |
| **LD-00003** Vikram Singh | Swift Logistics | Priya Sharma | Rajesh Kumar | **Fully assigned** — sales works lead |
| **LD-00004** Ananya Reddy | BankTech Solutions | Priya Sharma | — | Manager only |
| **LD-00005** Rahul Mehta | StartupIO | Priya Sharma | Meera Das | Fully assigned |
| **LD-00006** Lakshmi Iyer | FinTech Hub | Priya Sharma | Arun Singh | Fully assigned |

**Create lead form example (copy-style):**

- Name: Amit Sharma · Email: `amit@techcorp.in` · Company: TechCorp India  
- Service: Custom CRM Development · Manager: Priya Sharma · Executive: Rajesh Kumar (optional)

---

## Organization Chart

```
                         ADMIN
                    Admin Mythisoft
                 admin@mythisoft.com
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
  SALES MANAGER      TECH MANAGER       SUPPORT MANAGER
  Priya Sharma       Vikram Nair        Sunita Patel
  (Msale team)       (MT team)          (SM team)
       │                   │                   │
  ┌────┴────┐         ┌────┴────┐              │
  │ sale100 │         │tech1000 │         support500
  │ sale101 │         │tech1001 │
  └─────────┘         └─────────┘
```

---

## All Login Accounts (12 users)

| Role | Name | Email | Password | Emp ID | Team | Reports To | Team Lead? |
|------|------|-------|----------|--------|------|------------|------------|
| **Admin** | Admin Mythisoft | admin@mythisoft.com | admin123 | EMP-001 | — | — | — |
| **Manager** | Priya Sharma | manager@mythisoft.com | manager123 | EMP-100 | Msale | — | — |
| **Manager** | Vikram Nair | tech.manager@mythisoft.com | manager123 | EMP-101 | MT | — | — |
| **Manager** | Sunita Patel | support.manager@mythisoft.com | manager123 | EMP-102 | SM | — | — |
| **Sales** | Meera Das | meera.sales@mythisoft.com | sales123 | EMP-201 | sale100 | Priya | **Yes** (sale100 lead) |
| **Sales** | Rajesh Kumar | rajesh@mythisoft.com | sales123 | EMP-200 | sale100 | Priya | No |
| **Sales** | Arun Singh | arun.sales@mythisoft.com | sales123 | EMP-202 | sale101 | Priya | No |
| **Technical** | Kiran Rao | technical@mythisoft.com | tech123 | EMP-1000 | tech1000 | Vikram | **Yes** (tech1000 lead) |
| **Technical** | Deepak Verma | deepak.tech@mythisoft.com | tech123 | EMP-1001 | tech1000 | Vikram | No |
| **Technical** | Rohit Menon | rohit.tech@mythisoft.com | tech123 | EMP-1002 | tech1001 | Vikram | No |
| **Support** | Anil Reddy | support@mythisoft.com | support123 | EMP-500 | support500 | Sunita | **Yes** (support500 lead) |
| **Support** | Kavita Rao | kavita.support@mythisoft.com | support123 | EMP-501 | support500 | Sunita | No |

---

## Teams (Settings → Teams)

### Manager Teams (bosses)

| Code | Name | Manages Department |
|------|------|--------------------|
| Msale | Sales Managers | Sales |
| MT | Technical Managers | Technical |
| SM | Support Managers | Support |

### Role Teams (staff)

| Code | Name | Group | Team Lead |
|------|------|-------|-----------|
| sale100 | Sales Team Alpha | Sales | Meera Das |
| sale101 | Sales Team Beta | Sales | — |
| tech1000 | Dev Team Alpha | Technical | Kiran Rao |
| tech1001 | Dev Team Beta | Technical | — |
| support500 | Support Desk | Support | Anil Reddy |

---

## Sample Data by Department

### Sales Team

| Person | Sample Leads | Sample Deals | Sample Tasks |
|--------|-------------|--------------|--------------|
| **Rajesh** | LD-00003 Vikram, LD-00001 (unassigned until admin routes) | ERP TechNova ₹25L, IoT RetailMax ₹35L | Follow up Amit, Demo Vikram |
| **Meera** | LD-00005 Rahul, LD-00002 (manager queue) | CRM HealthCare ₹12L, AI BankTech | Prepare HealthCare proposal |
| **Arun** | LD-00006 Lakshmi, LD-00004 (manager queue) | LMS EduSmart ₹8L | Cold outreach BankTech |

**Customers:** Sanjay Gupta (TechNova), Meera Iyer (HealthCare), Arjun Nair (EduSmart)

---

### Technical Team

| Person | Sample Projects | Sample Tasks | Sample Tickets |
|--------|----------------|--------------|----------------|
| **Kiran** (Lead) | TechNova CRM, EduSmart LMS | CRM API integration | TK-00001 Login issue |
| **Deepak** | TechNova CRM | Fix login auth bug | TK-00003 Slow dashboard |
| **Rohit** | HealthCare ERP, EduSmart LMS | Mobile app UI screens | — |

**Projects:**

| Project | Customer | Budget | Status | Assigned To |
|---------|----------|--------|--------|-------------|
| TechNova CRM Rollout | TechNova | ₹5,90,000 | In progress | Kiran, Deepak |
| HealthCare ERP Setup | HealthCare Plus | ₹14,16,000 | Planning | Rohit |
| EduSmart LMS Build | EduSmart | ₹8,00,000 | Testing | Kiran, Rohit |

---

### Support Team

| Person | Sample Tickets | Sample Tasks |
|--------|---------------|--------------|
| **Anil** (Lead) | TK-00001 Login issue, TK-00003 Slow dashboard | Update login FAQ (done) |
| **Kavita** | TK-00002 Report export, TK-00004 LMS training | Respond to TK-00002 |

---

### Managers

| Manager | Department | What they manage |
|---------|------------|------------------|
| **Priya Sharma** | Sales | Rajesh, Meera, Arun — assign leads from admin, deals, quotes |
| **Vikram Nair** | Technical | Kiran, Deepak, Rohit — projects, dev tasks |
| **Sunita Patel** | Support | Anil, Kavita — tickets, customer issues |

---

## Other Sample Data

| Module | Count | Examples |
|--------|-------|----------|
| Companies | 4 | TechNova, HealthCare Plus, EduSmart, RetailMax |
| Leads | 6 | LD-00001 to LD-00006 (see workflow table above) |
| Deals | 5 | ERP, CRM, LMS, IoT, AI Analytics |
| Quotations | 2 | QT-00001 (sent), QT-00002 (approved) |
| Invoices | 2 | INV-00001 (sent), INV-00002 (paid) |
| Meetings | 3 | Discovery call, Demo, Sprint planning |
| Attendance | 8 | All staff marked present today |
| Leave | 3 | Rajesh (pending), Deepak (approved), Kavita (pending) |

---

## Try It — Step by Step

1. Run `npm run seed` then `npm run dev`
2. Login as **admin@mythisoft.com** → Leads → see **LD-00001** unassigned → Assign Manager **Priya Sharma**
3. Login as **manager@mythisoft.com** → `/leads/assign` → assign **LD-00002** or **LD-00004** to Rajesh/Meera/Arun
4. Login as **rajesh@mythisoft.com** → My Leads → work **LD-00003**
5. Login as **technical@mythisoft.com** → projects and TK-00001
6. Login as **support@mythisoft.com** → support tickets

---

*MYTHISOFT INNOVATION PRIVATE LIMITED — Hyderabad, India*
