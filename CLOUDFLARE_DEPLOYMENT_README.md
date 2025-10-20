# 🚀 Cloudflare Pages Deployment - Complete Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Detailed Setup](#detailed-setup)
5. [Workflow Explanation](#workflow-explanation)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)
8. [FAQ](#faq)

---

## Overview

This project is configured for automatic deployment to Cloudflare Pages using GitHub Actions. Every push to the `master` branch triggers a CI/CD pipeline that:

1. ✅ Lints the code (ESLint)
2. ✅ Runs unit tests (Vitest)
3. ✅ Builds the Astro project
4. ✅ Deploys to Cloudflare Pages

**Note**: E2E tests are NOT run in the deployment workflow (only in PR workflow).

---

## Prerequisites

### Required Accounts:
- [x] GitHub account (you have this!)
- [x] Supabase project
- [x] GROQ API account
- [x] Cloudflare account (free tier works!)

### Required Tools (for local development):
- Node.js 22.14.0 (specified in `.nvmrc`)
- npm (comes with Node.js)
- Git

---

## Quick Start

### 1️⃣ Add GitHub Secrets (10 minutes)

Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

Add these 8 secrets:

| Secret Name | Where to Get It |
|-------------|-----------------|
| `PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `PUBLIC_SUPABASE_KEY` | Supabase Dashboard → Settings → API |
| `GROQ_API_KEY` | https://console.groq.com/keys |
| `GROQ_MODEL` | Use: `llama-3.3-70b-versatile` |
| `GROQ_BASE_URL` | Use: `https://api.groq.com/openai/v1` |
| `CLOUDFLARE_API_TOKEN` | https://dash.cloudflare.com/profile/api-tokens |
| `CLOUDFLARE_ACCOUNT_ID` | https://dash.cloudflare.com/ (sidebar) |
| `CLOUDFLARE_PROJECT_NAME` | Your choice (e.g., `my-app`) |

📖 **Detailed instructions**: See `GITHUB_SECRETS_QUICK_SETUP.md`

### 2️⃣ Deploy

```bash
git push origin master
```

### 3️⃣ Access Your Site

```
https://YOUR_PROJECT_NAME.pages.dev
```

---

## Detailed Setup

### Step 1: Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → Use for `PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use for `PUBLIC_SUPABASE_KEY`

### Step 2: Get GROQ Credentials

1. Go to https://console.groq.com/
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Create API Key**
5. Copy the key → Use for `GROQ_API_KEY`

For `GROQ_MODEL` and `GROQ_BASE_URL`, use the default values:
- `GROQ_MODEL`: `llama-3.3-70b-versatile`
- `GROQ_BASE_URL`: `https://api.groq.com/openai/v1`

### Step 3: Get Cloudflare Credentials

#### A. Get API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Choose **Edit Cloudflare Workers** template OR create custom:
   - **Permissions**: Account → Cloudflare Pages → Edit
   - **Account Resources**: Include → Your Account
4. Click **Continue to summary** → **Create Token**
5. **IMPORTANT**: Copy the token immediately (you won't see it again!)

#### B. Get Account ID

1. Go to https://dash.cloudflare.com/
2. Select your account (or create one if needed)
3. Look at the right sidebar
4. Find **Account ID** (32-character hash)
5. Copy it

#### C. Choose Project Name

Pick a name for your project:
- **Rules**: lowercase letters, numbers, hyphens only
- **Examples**: `10xdevs-flashcards`, `my-astro-app`, `flashcard-app`
- **Your URL will be**: `https://your-project-name.pages.dev`

### Step 4: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. In the left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret:
   - Enter the **Name** (exactly as shown above)
   - Paste the **Value**
   - Click **Add secret**
6. Repeat for all 8 secrets

### Step 5: Verify Setup

After adding all secrets, push to master:

```bash
git add .
git commit -m "Configure deployment"
git push origin master
```

Or trigger manually:
1. Go to **Actions** tab
2. Select **Deploy to Cloudflare Pages**
3. Click **Run workflow**
4. Select **master** branch
5. Click **Run workflow**

### Step 6: Monitor Deployment

1. Go to **Actions** tab in GitHub
2. Click on the latest workflow run
3. Watch the progress:
   - ✅ Lint
   - ✅ Unit tests
   - ✅ Deploy

### Step 7: Access Your Site

Once deployment succeeds:
1. Visit `https://your-project-name.pages.dev`
2. Check Cloudflare Dashboard for deployment details

---

## Workflow Explanation

### Workflow File: `.github/workflows/master.yml`

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [master]  # Triggers on push to master
  workflow_dispatch: {}  # Allows manual trigger
```

### Jobs Overview

#### 1. Lint Job
- **Purpose**: Check code quality
- **Runs**: ESLint
- **Fails if**: Linting errors found

#### 2. Unit Tests Job
- **Purpose**: Run unit tests
- **Runs**: Vitest with coverage
- **Depends on**: Lint job
- **Uploads**: Coverage artifacts
- **Fails if**: Tests fail

#### 3. Deploy Job
- **Purpose**: Build and deploy to Cloudflare
- **Depends on**: Lint + Unit tests
- **Steps**:
  1. Validate Cloudflare secrets
  2. Build project (`npm run build`)
  3. Verify build output
  4. Deploy to Cloudflare Pages
  5. Show deployment summary
- **Fails if**: Any step fails

### Environment Variables

The workflow uses these environment variables:

**Build-time** (from GitHub Secrets):
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_KEY`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GROQ_BASE_URL`

**Deployment** (from GitHub Secrets):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PROJECT_NAME`

**Runtime** (must be set in Cloudflare Dashboard):
- Same as build-time variables (except Cloudflare ones)

---

## Troubleshooting

### Common Issues

#### ❌ "CLOUDFLARE_API_TOKEN is NOT set"

**Cause**: Secret not added or wrong name

**Fix**:
1. Go to GitHub Secrets page
2. Verify secret name is exactly: `CLOUDFLARE_API_TOKEN`
3. Check for typos or extra spaces

#### ❌ "dist directory does not exist"

**Cause**: Build failed

**Fix**:
1. Check build logs in GitHub Actions
2. Run `npm run build` locally to reproduce
3. Check for TypeScript errors or missing dependencies

#### ❌ "Invalid API Token"

**Cause**: Token doesn't have correct permissions

**Fix**:
1. Go to Cloudflare API Tokens
2. Verify token has "Cloudflare Pages: Edit" permission
3. Create new token if needed

#### ❌ "Project not found"

**Cause**: Project doesn't exist in Cloudflare

**Fix**:
- Let the workflow create it automatically (it will on first deploy)
- Or create manually in Cloudflare Dashboard

#### ⚠️ "_worker.js not found"

**Cause**: Cloudflare adapter not configured

**Fix**:
1. Verify `astro.config.mjs` has Cloudflare adapter
2. Check `package.json` has `@astrojs/cloudflare` installed
3. Run `npm install` to ensure dependencies are installed

### Debug Steps

1. **Check GitHub Actions logs**:
   - Go to Actions tab
   - Click on failed workflow
   - Expand failed step
   - Read error message

2. **Verify secrets**:
   - Go to Settings → Secrets → Actions
   - Count: Should have 8 secrets
   - Names: Must match exactly (case-sensitive)

3. **Test locally**:
   ```bash
   npm install
   npm run lint
   npm run test
   npm run build
   ```

4. **Check Cloudflare Dashboard**:
   - Go to Workers & Pages → Pages
   - Look for your project
   - Check deployment logs

---

## Best Practices

### Security

✅ **DO**:
- Rotate API tokens every 90 days
- Use separate tokens for different environments
- Review token permissions regularly
- Enable 2FA on all accounts

❌ **DON'T**:
- Share tokens in chat or email
- Commit secrets to repository
- Use production tokens in development
- Give tokens more permissions than needed

### Development Workflow

```
feature branch → PR → master → auto-deploy
       ↓          ↓       ↓
    local dev    CI     CD
```

1. **Feature branch**: Develop locally
2. **Pull Request**: Triggers `pull-request.yml` (lint, test, E2E)
3. **Merge to master**: Triggers `master.yml` (lint, test, deploy)

### Environment Separation

| Environment | Branch | Supabase | Cloudflare | Domain |
|-------------|--------|----------|------------|--------|
| Development | feature/* | Dev project | N/A | localhost |
| Staging | develop | Staging project | Staging Pages | staging.example.com |
| Production | master | Prod project | Prod Pages | example.com |

### Monitoring

Set up monitoring for:
- [ ] Deployment success/failure notifications
- [ ] Cloudflare Analytics
- [ ] Error tracking (e.g., Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring

---

## FAQ

### Q: How long does deployment take?
**A**: Typically 3-5 minutes (lint + test + build + deploy)

### Q: Can I deploy to multiple environments?
**A**: Yes! Create separate workflows for staging/production with different secrets

### Q: What if I want to use a custom domain?
**A**: Configure it in Cloudflare Pages Dashboard → Custom domains

### Q: Can I rollback a deployment?
**A**: Yes! In Cloudflare Dashboard → Deployments → Select previous deployment → Rollback

### Q: How do I see deployment logs?
**A**: GitHub Actions tab → Select workflow run → Expand steps

### Q: Can I skip tests during deployment?
**A**: Not recommended, but you can modify the workflow to remove test jobs

### Q: What's the difference between `master.yml` and `pull-request.yml`?
**A**:
- `pull-request.yml`: Runs on PRs, includes E2E tests, no deployment
- `master.yml`: Runs on master, no E2E tests, includes deployment

### Q: How do I update environment variables?
**A**: Update GitHub Secrets AND Cloudflare Pages environment variables

### Q: Can I deploy manually without pushing?
**A**: Yes! Actions tab → Deploy to Cloudflare Pages → Run workflow

### Q: What happens if deployment fails?
**A**: The workflow stops, shows error message, and doesn't deploy broken code

---

## Additional Resources

### Documentation Files:
- 📖 `CLOUDFLARE_DEPLOYMENT_COMPLETE.md` - Comprehensive setup guide
- 📖 `DEPLOYMENT_SETUP_SUMMARY.md` - Quick summary
- 📖 `GITHUB_SECRETS_QUICK_SETUP.md` - Secrets setup guide
- 📖 `CLOUDFLARE_DEPLOYMENT_TROUBLESHOOTING.md` - Troubleshooting guide
- 📖 `CLOUDFLARE_DEBUG_GUIDE.md` - Debug guide

### External Links:
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## Support

### Need Help?

1. **Check documentation** (files listed above)
2. **Review workflow logs** (GitHub Actions tab)
3. **Check Cloudflare Dashboard** (deployment logs)
4. **Search GitHub Issues** (might be a known issue)

### Reporting Issues

When reporting issues, include:
- [ ] GitHub Actions workflow logs
- [ ] Error messages (full text)
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior
- [ ] Environment details (Node version, etc.)

---

## Summary

✅ **Project configured** for Cloudflare Pages deployment  
✅ **Workflow created** for automatic CI/CD  
✅ **Latest actions** verified and used  
✅ **Comprehensive validation** and error handling  
✅ **Documentation** complete and detailed  

**Next step**: Add GitHub Secrets and push to master! 🚀

---

**Last Updated**: 2025-10-20  
**Workflow File**: `.github/workflows/master.yml`  
**Node Version**: 22.14.0  
**Astro Adapter**: @astrojs/cloudflare

