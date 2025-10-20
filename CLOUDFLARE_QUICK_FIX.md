# Quick Fix: Cloudflare Pages Deployment Error

## Error You're Seeing

```
✘ [ERROR] Project not found. The specified project name does not match any of your existing projects. [code: 8000007]
```

## What This Means

The Cloudflare Pages project doesn't exist yet. You need to create it manually before GitHub Actions can deploy to it.

## Quick Fix (5 minutes)

### Step 1: Create the Project in Cloudflare

1. Go to https://dash.cloudflare.com/
2. Click **Workers & Pages** (left sidebar)
3. Click **Create application**
4. Click **Pages** tab
5. Click **Upload assets**
6. Enter your project name (must match your `CLOUDFLARE_PROJECT_NAME` GitHub secret)
7. Click **Create project**

### Step 2: Configure Environment Variables

In your newly created project:

1. Go to **Settings** > **Environment variables**
2. Add these variables for **Production**:
   - `PUBLIC_SUPABASE_URL` → Your Supabase URL
   - `PUBLIC_SUPABASE_KEY` → Your Supabase anon key
   - `SUPABASE_URL` → Same as PUBLIC_SUPABASE_URL
   - `SUPABASE_KEY` → Same as PUBLIC_SUPABASE_KEY
   - `GROQ_API_KEY` → Your GROQ API key
   - `GROQ_MODEL` → `llama-3.3-70b-versatile`
   - `GROQ_BASE_URL` → `https://api.groq.com/openai/v1`

### Step 3: Configure KV Binding for Sessions

1. In your project, go to **Settings** > **Functions**
2. Scroll to **KV namespace bindings**
3. Click **Add binding**
4. Variable name: `SESSION`
5. KV namespace: Click **Create a new namespace** → Name it `SESSION`
6. Click **Save**

### Step 4: Re-run GitHub Action

1. Go to your GitHub repository
2. Click **Actions** tab
3. Find the failed workflow
4. Click **Re-run all jobs**

## Done! ✅

Your deployment should now succeed. The app will be available at:
```
https://[your-project-name].pages.dev
```

## Need More Help?

- **Detailed guide:** See `CLOUDFLARE_PROJECT_CREATION_FIX.md`
- **Troubleshooting:** See `CLOUDFLARE_DEPLOYMENT_TROUBLESHOOTING.md`
- **Setup guide:** See `CLOUDFLARE_DEPLOYMENT_SETUP.md`

## Common Mistakes to Avoid

❌ **Project name mismatch** - The name in Cloudflare must **exactly** match `CLOUDFLARE_PROJECT_NAME` in GitHub Secrets

❌ **Forgot KV binding** - The app needs a KV namespace called `SESSION` for session storage

❌ **Missing environment variables** - All variables must be set in Cloudflare Pages, not just GitHub Secrets

## Verification Checklist

Before re-running the GitHub Action, verify:

- [ ] Project exists in Cloudflare Dashboard
- [ ] Project name matches GitHub secret exactly
- [ ] All 7+ environment variables are configured
- [ ] KV namespace binding `SESSION` is configured
- [ ] GitHub secrets are still valid (API token, Account ID)

