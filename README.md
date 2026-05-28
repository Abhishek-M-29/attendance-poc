# Acharya Attendance System

Role-based attendance and event management system built with Next.js, Supabase, and shadcn/ui.

## Requirements

- Node.js 20+
- Supabase project (URL + anon key)
- Netlify account (for deployment)

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login).

## Database Setup

Use the Supabase SQL editor to run the setup script:

```sql
sql/setup.sql
```

If you need to fix profile mappings or policies, see:

- `sql/fix_profiles.sql`
- `sql/fix_update_policy.sql`

## Netlify Deployment

This repo includes a `netlify.toml` with the correct build settings and plugin. In Netlify, set the environment variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Build command: `npm run build`
Publish directory: `.next`

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run lint checks
