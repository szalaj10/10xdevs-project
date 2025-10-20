# GitHub Secrets Quick Setup Guide

## 🚀 Fast Track Setup

### Step 1: Open GitHub Secrets Page
```
https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
```

### Step 2: Add All Secrets

Copy and paste each secret below. Click **New repository secret** for each one.

---

## 📋 Required Secrets Checklist

### ✅ Supabase Configuration

#### PUBLIC_SUPABASE_URL
```
Name: PUBLIC_SUPABASE_URL
Value: https://xxxxxxxxxxxxx.supabase.co
```
**Where to find**: Supabase Dashboard → Project Settings → API → Project URL

#### PUBLIC_SUPABASE_KEY
```
Name: PUBLIC_SUPABASE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Where to find**: Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`

---

### ✅ GROQ Configuration

#### GROQ_API_KEY
```
Name: GROQ_API_KEY
Value: gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
**Where to find**: https://console.groq.com/keys

#### GROQ_MODEL
```
Name: GROQ_MODEL
Value: llama-3.3-70b-versatile
```
**Default**: Use the value above (or your preferred model)

#### GROQ_BASE_URL
```
Name: GROQ_BASE_URL
Value: https://api.groq.com/openai/v1
```
**Default**: Use the value above

---

### ✅ Cloudflare Configuration

#### CLOUDFLARE_API_TOKEN
```
Name: CLOUDFLARE_API_TOKEN
Value: your-cloudflare-api-token-here
```

**How to get**:
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use template: **Edit Cloudflare Workers** OR create custom token:
   - **Permissions**: Account → Cloudflare Pages → Edit
   - **Account Resources**: Include → Your Account
4. Click **Continue to summary** → **Create Token**
5. **Copy the token** (you won't see it again!)

#### CLOUDFLARE_ACCOUNT_ID
```
Name: CLOUDFLARE_ACCOUNT_ID
Value: 32-character-hash-here
```

**How to get**:
1. Go to: https://dash.cloudflare.com/
2. Select your account (or create one)
3. Look at the right sidebar → **Account ID**
4. Copy the 32-character hash

#### CLOUDFLARE_PROJECT_NAME
```
Name: CLOUDFLARE_PROJECT_NAME
Value: your-project-name
```

**Rules**:
- Only lowercase letters, numbers, and hyphens
- No spaces or special characters
- Example: `10xdevs-flashcards` or `my-astro-app`

**Your site will be**: `https://your-project-name.pages.dev`

---

## 🎯 Quick Validation

After adding all secrets, verify them:

### Option 1: Push to Master
```bash
git push origin master
```

The workflow will validate all secrets and show helpful error messages if any are missing.

### Option 2: Manual Workflow Run
1. Go to: **Actions** tab
2. Select: **Deploy to Cloudflare Pages**
3. Click: **Run workflow**
4. Select branch: **master**
5. Click: **Run workflow**

---

## ✅ Secrets Checklist

Use this checklist to ensure you've added all secrets:

- [ ] `PUBLIC_SUPABASE_URL`
- [ ] `PUBLIC_SUPABASE_KEY`
- [ ] `GROQ_API_KEY`
- [ ] `GROQ_MODEL`
- [ ] `GROQ_BASE_URL`
- [ ] `CLOUDFLARE_API_TOKEN`
- [ ] `CLOUDFLARE_ACCOUNT_ID`
- [ ] `CLOUDFLARE_PROJECT_NAME`

**Total**: 8 secrets required

---

## 🔍 Troubleshooting

### "PUBLIC_SUPABASE_URL is NOT set"
- Check spelling (must be exact)
- Ensure you clicked "Add secret" after pasting
- Refresh the secrets page to verify it was saved

### "CLOUDFLARE_API_TOKEN is NOT set"
- Token must have "Cloudflare Pages: Edit" permission
- Don't include any extra spaces or newlines
- Token should start with a long alphanumeric string

### "CLOUDFLARE_ACCOUNT_ID is NOT set"
- Must be exactly 32 characters
- It's a hexadecimal hash (letters and numbers)
- Found in Cloudflare Dashboard sidebar

### "CLOUDFLARE_PROJECT_NAME is NOT set"
- Must be lowercase only
- Use hyphens instead of spaces
- No underscores or special characters

---

## 📱 Mobile-Friendly Version

If you're setting this up on mobile, here's a condensed version:

```
1. Go to: github.com/YOUR_REPO/settings/secrets/actions
2. Add 8 secrets:
   - PUBLIC_SUPABASE_URL (from Supabase)
   - PUBLIC_SUPABASE_KEY (from Supabase)
   - GROQ_API_KEY (from Groq)
   - GROQ_MODEL (llama-3.3-70b-versatile)
   - GROQ_BASE_URL (https://api.groq.com/openai/v1)
   - CLOUDFLARE_API_TOKEN (from Cloudflare)
   - CLOUDFLARE_ACCOUNT_ID (from Cloudflare)
   - CLOUDFLARE_PROJECT_NAME (your choice)
3. Push to master or run workflow manually
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Rotate API tokens every 90 days
- Use separate tokens for dev/staging/prod
- Review token permissions regularly
- Use least-privilege access

### ❌ DON'T:
- Share tokens in chat or email
- Commit secrets to repository
- Use production tokens in development
- Give tokens more permissions than needed

---

## 🎓 Understanding Secrets

### What are GitHub Secrets?
Encrypted environment variables stored in GitHub, accessible only during workflow runs.

### Why use them?
- Keep sensitive data secure
- Prevent accidental exposure
- Enable CI/CD automation
- Separate configuration from code

### How are they used?
In workflows, access them with: `${{ secrets.SECRET_NAME }}`

---

## 📚 Additional Resources

- **Full Setup Guide**: `CLOUDFLARE_DEPLOYMENT_COMPLETE.md`
- **Troubleshooting**: `CLOUDFLARE_DEPLOYMENT_TROUBLESHOOTING.md`
- **Workflow Details**: `.github/workflows/master.yml`

---

## ⏱️ Estimated Setup Time

- **Supabase secrets**: 2 minutes
- **GROQ secrets**: 2 minutes
- **Cloudflare secrets**: 5 minutes
- **Verification**: 2 minutes

**Total**: ~10-15 minutes

---

## 🎉 You're Done!

Once all 8 secrets are added:
1. Push to master branch
2. Watch the deployment in Actions tab
3. Visit `https://your-project-name.pages.dev`

**Need help?** Check the troubleshooting section or full documentation.

