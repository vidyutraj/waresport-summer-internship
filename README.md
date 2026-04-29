# Waresport Intern Portal

A production-ready full-stack intern management portal built with Next.js 14, Prisma, NextAuth, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js v4 with credentials provider
- **Database**: PostgreSQL via Prisma ORM
- **Styling**: Tailwind CSS + custom shadcn-inspired components
- **Deployment**: Vercel + Supabase / Railway

## Features

- Role-based auth (Admin / Intern) with protected routes
- First-login password change flow
- Intern dashboard with week-at-a-glance task view
- Task management with assignment by track or all interns
- Weekly scrum log submissions (with Friday reminders)
- Knowledge base / resources with required reading
- Admin dashboard with completion rates and intern roster
- Announcements system

## Getting Started

### 1. Clone & install

```bash
npm install
```

### 2. Set up environment variables

Copy `.env` and fill in your values:

```env
DATABASE_URL="postgresql://user:password@host:5432/waresport?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-here"

# SMTP (works with Gmail, Outlook, or any provider)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="you@gmail.com"
SMTP_PASS="your-app-password"   # Gmail: use an App Password, not your account password
SMTP_FROM="you@gmail.com"
```

### Gmail setup (recommended)
1. Enable 2FA on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an App Password for "Mail" — use that 16-character code as `SMTP_PASS`

### Other providers
| Provider | SMTP_HOST | SMTP_PORT |
|----------|-----------|-----------|
| Outlook/Hotmail | `smtp-mail.outlook.com` | `587` |
| Yahoo | `smtp.mail.yahoo.com` | `587` |
| iCloud | `smtp.mail.me.com` | `587` |
| Custom/Postmark/Mailgun | their SMTP host | `587` |

Generate a secret with:
```bash
openssl rand -base64 32
```

### 3. Set up the database

```bash
# Apply migrations
npm run db:migrate

# Seed the database (admins come from SEED_ADMIN_* in `.env` — see `.env.example`)
npm run db:seed

# Wipe all application data and reseed (destructive; use for a clean slate)
npm run db:seed:fresh
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Admin accounts (after seed)

Admins are created from **`SEED_ADMIN_1_*`** and **`SEED_ADMIN_2_*`** in your `.env` (never committed). Use those emails and passwords to sign in. Add interns from the admin UI.

## Routes

### Intern
| Route | Description |
|-------|-------------|
| `/login` | Login page |
| `/dashboard` | Week overview, tasks, announcements |
| `/tasks` | All tasks grouped by week |
| `/tasks/[id]` | Task detail |
| `/logs` | Submit & view weekly logs |
| `/resources` | Knowledge base |
| `/profile` | Edit profile |

### Admin
| Route | Description |
|-------|-------------|
| `/admin` | Dashboard overview |
| `/admin/interns` | Intern roster |
| `/admin/interns/[id]` | Per-intern view |
| `/admin/tasks` | Create & manage tasks |
| `/admin/logs` | All weekly log submissions |
| `/admin/resources` | Upload/manage resources |
| `/admin/announcements` | Post announcements |

## Deployment

### Vercel + Supabase

1. Create a Supabase project and get the `DATABASE_URL` (Transaction pooler recommended)
2. Push to GitHub and connect to Vercel
3. Set environment variables in Vercel dashboard
4. Run `npx prisma migrate deploy` after first deployment

### Railway

Use the Railway PostgreSQL plugin and set `DATABASE_URL` from the Railway dashboard.

## Database Schema

See `prisma/schema.prisma` for the full schema including:
- `User` (ADMIN | INTERN roles, track, profile fields)
- `Task` (week number, assignedTo: ALL | TRACK | INDIVIDUAL)
- `TaskAssignment` (per-intern task status with completedAt timestamp)
- `WeeklyLog` (scrum-style weekly reflection)
- `Resource` (knowledge base with categories and required flag)
- `Announcement` (all-intern broadcast messages)
