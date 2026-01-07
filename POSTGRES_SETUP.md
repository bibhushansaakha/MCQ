# PostgreSQL Setup Guide

## ✅ What's Been Done

1. ✅ Prisma schema updated to use PostgreSQL
2. ✅ PostgreSQL migration created
3. ✅ Code updated to work with PostgreSQL

## 🔧 What You Need to Do in Vercel

### Step 1: Set DATABASE_URL Environment Variable

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Use the **direct PostgreSQL connection string** (the one starting with `postgres://`)
   
   From your provided strings, use this one:
   ```
   postgres://86859839751bd1d94d75f9486070aab56188d52da6f923370f2815b38718a572:sk_yg0tT1CmXFkRpIi7-kBU6@db.prisma.io:5432/postgres?sslmode=require
   ```
   
   **DO NOT use** the Prisma Accelerate URL (the one starting with `prisma+postgres://`) unless you specifically want to use Accelerate.

4. Apply to: **Production**, **Preview**, and **Development** (select all)
5. Click **Save**

### Step 2: Deploy

1. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Switch to PostgreSQL for Vercel"
   git push
   ```

2. Vercel will automatically deploy

### Step 3: Initialize Database

After deployment succeeds:

1. Visit: `https://your-app.vercel.app/api/init-db`
2. Or make a POST request:
   ```bash
   curl -X POST https://your-app.vercel.app/api/init-db
   ```

This will:
- Create all database tables
- Import all topics from `topics.json`
- Import all questions from JSON files

### Step 4: Verify

Visit your app homepage - you should now see all chapters!

## 🎯 Important Notes

- **Database persists**: Unlike SQLite, PostgreSQL data persists across deployments
- **No manual initialization needed**: After the first `/api/init-db` call, everything works automatically
- **Connection string**: Vercel may have already set `DATABASE_URL` automatically. Check your environment variables first - if it's already there, you're good to go!

## 🐛 Troubleshooting

If you see "No topics found":
1. Check that `DATABASE_URL` is set correctly in Vercel
2. Visit `/api/init-db` to initialize the database
3. Check Vercel function logs for any errors

If migrations fail:
- The code will automatically try `prisma db push` as a fallback
- Check Vercel deployment logs for details

