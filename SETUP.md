# Q-Pro Setup Guide

## Complete Supabase + Local Setup Instructions

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy the following from **Project Settings → API**:
   - `Project URL`
   - `anon (public)` key
   - `service_role` (secret) key

---

## Step 2: Configure Environment Variables

Open `.env.local` and fill in your values (or add them to Vercel/Production settings):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=https://q-pro.vercel.app
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=rikashrikash04@gmail.com
NEXT_PUBLIC_OFFICE_ADMIN_EMAILS=resulthub001@gmail.com,rikash04rikash@gmail.com
```

---

## Step 3: Run the Database Schema

1. Open **Supabase Dashboard → SQL Editor**
2. Copy and paste the entire contents of `supabase-schema.sql`
3. Click **Run**

This will create all tables, indexes, and Row Level Security policies.

---

## Step 4: Enable Google OAuth

1. In Supabase Dashboard → **Authentication → Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials (from Google Cloud Console)
4. Set the **Redirect URL** to: 
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://q-pro.vercel.app/auth/callback`

---

## Step 5: Enable Realtime

1. In Supabase Dashboard → **Database → Replication**
2. Make sure `queue_tokens` and `office_queue_state` tables are enabled for realtime

> The SQL schema already does this with `ALTER PUBLICATION` statements, but verify in the dashboard.

---

## Step 6: Run the Server

### Local Development:
```bash
# Increased header size to avoid 431 error
$env:NODE_OPTIONS='--max-http-header-size=65536'; npm run dev
```

Visit `http://localhost:3000` (or `http://localhost:3001` if 3000 is busy)

### Production (Vercel):
The project is already configured for Vercel. Make sure all environment variables are added in the Vercel project settings.

---

## Role Access Guide

| Role | Login Email | Dashboard |
|------|-------------|-----------|
| Super Admin | `rikashrikash04@gmail.com` | `/super-admin/dashboard` |
| Office Admin | `resulthub001@gmail.com` or `rikash04rikash@gmail.com` | `/office-admin/dashboard` |
| Public | Any email or no login | `/offices` |

---

## Admin Workflow

### Super Admin:
1. Login → redirected to `/super-admin/dashboard`
2. Create offices → `/super-admin/offices/new`
3. Click on an office → `/super-admin/offices/[id]`
4. Add departments (optional)
5. Assign office admin by email

### Office Admin:
1. Login → redirected to `/office-admin/dashboard`
2. Use **Serve Next** to advance the queue
3. Use **Skip** to skip a token
4. Use **Pause/Resume** to temporarily halt
5. Use **Close/Open** to end the day's queue

### Public User:
1. Visit `/offices`
2. Select an office
3. Fill in name + department
4. Get token
5. Track status in real-time at `/offices/[slug]/token/[id]`

---

## Deploying to Vercel

1. Push to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Add all `.env.local` values as Vercel Environment Variables
4. Update Supabase Auth redirect URLs to include your Vercel URL

---

## Architecture Notes

- **Multi-tenant isolation**: Every query is scoped by `office_id`
- **RLS enforced**: Even if frontend is compromised, DB still enforces role checks
- **Realtime**: Queue updates broadcast instantly via Supabase channels
- **Token numbering**: Per-office, per-day sequential numbering
- **Service role API**: Admin assignment uses service role (server-only)
