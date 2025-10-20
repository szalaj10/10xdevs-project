# ✅ Cloudflare Pages Deployment Checklist

Use this checklist to ensure everything is configured correctly before your first deployment.

---

## 📋 Pre-Deployment Checklist

### 1. Project Configuration

- [x] Astro configured with Cloudflare adapter (`astro.config.mjs`)
- [x] Node.js version specified in `.nvmrc` (22.14.0)
- [x] Build script exists in `package.json` (`npm run build`)
- [x] Cloudflare adapter installed (`@astrojs/cloudflare`)
- [x] GitHub Actions workflow created (`.github/workflows/master.yml`)

**Status**: ✅ All configured by setup script

---

### 2. GitHub Secrets (⚠️ YOU NEED TO DO THIS)

Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

#### Application Secrets:
- [ ] `PUBLIC_SUPABASE_URL` added
- [ ] `PUBLIC_SUPABASE_KEY` added
- [ ] `GROQ_API_KEY` added
- [ ] `GROQ_MODEL` added (use: `llama-3.3-70b-versatile`)
- [ ] `GROQ_BASE_URL` added (use: `https://api.groq.com/openai/v1`)

#### Cloudflare Secrets:
- [ ] `CLOUDFLARE_API_TOKEN` added
- [ ] `CLOUDFLARE_ACCOUNT_ID` added
- [ ] `CLOUDFLARE_PROJECT_NAME` added

**Total**: 8 secrets required

📖 **Guide**: See `GITHUB_SECRETS_QUICK_SETUP.md`

---

### 3. Cloudflare Account Setup

- [ ] Cloudflare account created (free tier is fine)
- [ ] API token created with "Cloudflare Pages: Edit" permission
- [ ] Account ID copied from dashboard
- [ ] Project name chosen (lowercase, hyphens only)

📖 **Guide**: See `CLOUDFLARE_DEPLOYMENT_README.md` → "Step 3: Get Cloudflare Credentials"

---

### 4. Local Testing (Recommended)

Before deploying, test locally:

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run unit tests
npm run test

# Build project
npm run build

# Verify dist/ directory exists
ls -la dist/
```

- [ ] Dependencies installed successfully
- [ ] Linting passes
- [ ] Unit tests pass
- [ ] Build completes without errors
- [ ] `dist/` directory created
- [ ] `dist/_worker.js/` directory exists

---

### 5. First Deployment

#### Option A: Push to Master
```bash
git add .
git commit -m "Configure Cloudflare deployment"
git push origin master
```

#### Option B: Manual Trigger
1. Go to **Actions** tab in GitHub
2. Select **Deploy to Cloudflare Pages**
3. Click **Run workflow**
4. Select **master** branch
5. Click **Run workflow**

- [ ] Deployment triggered
- [ ] Workflow started in GitHub Actions

---

### 6. Monitor Deployment

1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Watch the progress:

- [ ] ✅ Lint job completed
- [ ] ✅ Unit tests job completed
- [ ] ✅ Deploy job started
- [ ] ✅ Cloudflare secrets validated
- [ ] ✅ Build completed
- [ ] ✅ Build output verified
- [ ] ✅ Deployment to Cloudflare successful
- [ ] ✅ Deployment summary shown

---

### 7. Verify Deployment

- [ ] Visit `https://your-project-name.pages.dev`
- [ ] Site loads successfully
- [ ] No console errors in browser
- [ ] All pages accessible
- [ ] Forms work (if applicable)
- [ ] API endpoints work (if applicable)

---

### 8. Configure Runtime Environment Variables

⚠️ **Important**: GitHub Secrets are only for build time!

For runtime environment variables:

1. Go to Cloudflare Dashboard
2. Navigate to: **Workers & Pages** → **Your Project**
3. Click **Settings** → **Environment variables**
4. Add production variables:

- [ ] `PUBLIC_SUPABASE_URL` added
- [ ] `PUBLIC_SUPABASE_KEY` added
- [ ] `GROQ_API_KEY` added
- [ ] `GROQ_MODEL` added
- [ ] `GROQ_BASE_URL` added

5. Click **Save**
6. Redeploy (push to master again or trigger manually)

---

### 9. Post-Deployment Verification

- [ ] Site accessible globally (test from different locations)
- [ ] SSL certificate active (https://)
- [ ] All features work correctly
- [ ] No errors in Cloudflare Dashboard logs
- [ ] Performance is acceptable

---

### 10. Optional Enhancements

#### Custom Domain:
- [ ] Domain added in Cloudflare Pages
- [ ] DNS records configured
- [ ] SSL certificate issued
- [ ] Domain accessible

#### Analytics:
- [ ] Cloudflare Analytics enabled
- [ ] Tracking events configured

#### Monitoring:
- [ ] Error tracking setup (e.g., Sentry)
- [ ] Uptime monitoring configured
- [ ] Deployment notifications setup (Slack/Discord)

#### Security:
- [ ] Branch protection enabled on master
- [ ] 2FA enabled on GitHub
- [ ] 2FA enabled on Cloudflare
- [ ] API token rotation scheduled

---

## 🚨 Troubleshooting Checklist

If deployment fails, check:

### Secrets Issues:
- [ ] All 8 secrets added to GitHub
- [ ] Secret names match exactly (case-sensitive)
- [ ] No extra spaces in secret values
- [ ] Cloudflare API token has correct permissions
- [ ] Account ID is 32 characters

### Build Issues:
- [ ] `npm run build` works locally
- [ ] No TypeScript errors
- [ ] All dependencies installed
- [ ] Cloudflare adapter configured correctly

### Deployment Issues:
- [ ] Cloudflare account active
- [ ] API token not expired
- [ ] Project name valid (lowercase, hyphens only)
- [ ] Build output contains `dist/_worker.js/`

📖 **Full troubleshooting**: See `CLOUDFLARE_DEPLOYMENT_TROUBLESHOOTING.md`

---

## 📊 Deployment Status Tracker

### First Deployment:
- [ ] Secrets added
- [ ] First deployment triggered
- [ ] Deployment successful
- [ ] Site accessible
- [ ] Runtime env vars configured

### Subsequent Deployments:
- [ ] Changes pushed to master
- [ ] Workflow runs automatically
- [ ] Deployment successful
- [ ] Changes visible on site

---

## 🎯 Success Criteria

Your deployment is successful when:

✅ All GitHub Secrets added (8 total)  
✅ Workflow runs without errors  
✅ Site accessible at `https://your-project-name.pages.dev`  
✅ All features work correctly  
✅ No console errors  
✅ Runtime environment variables configured  
✅ SSL certificate active  

---

## 📝 Quick Reference

### GitHub Secrets URL:
```
https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
```

### GitHub Actions URL:
```
https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

### Cloudflare Dashboard:
```
https://dash.cloudflare.com/
```

### Your Site URL:
```
https://YOUR_PROJECT_NAME.pages.dev
```

---

## 📚 Documentation Quick Links

| Document | Purpose |
|----------|---------|
| `GITHUB_SECRETS_QUICK_SETUP.md` | **Start here!** Setup secrets in 10 minutes |
| `CLOUDFLARE_DEPLOYMENT_README.md` | Complete deployment guide |
| `DEPLOYMENT_SETUP_SUMMARY.md` | Quick overview |
| `DEPLOYMENT_FLOW_DIAGRAM.md` | Visual diagrams |
| `CLOUDFLARE_SETUP_COMPLETE.md` | Comprehensive summary |
| `CLOUDFLARE_DEPLOYMENT_TROUBLESHOOTING.md` | Troubleshooting guide |

---

## ⏱️ Time Estimates

| Task | Estimated Time |
|------|----------------|
| Add GitHub Secrets | 10-15 minutes |
| First deployment | 3-5 minutes |
| Verify deployment | 5 minutes |
| Configure runtime env vars | 5 minutes |
| **Total** | **25-30 minutes** |

---

## 🎉 Completion

Once all items are checked:

✅ **Your project is fully deployed to Cloudflare Pages!**

You can now:
- Push to master to trigger automatic deployments
- Monitor deployments in GitHub Actions
- View your site at `https://your-project-name.pages.dev`
- Configure custom domains
- Set up monitoring and analytics

---

**Last Updated**: 2025-10-20  
**Workflow**: `.github/workflows/master.yml`  
**Status**: 🟢 Ready for deployment

