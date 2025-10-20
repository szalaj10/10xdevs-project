# Cloudflare Pages Configuration Checklist

Based on your current Cloudflare Pages setup, here's what needs to be fixed:

## Current Status

✅ Project created: `10xdevs-project`  
✅ Domain active: `10xdevs-project-em1.pages.dev`  
✅ Production deployment successful  
⚠️ Environment variables incomplete  
⚠️ Variable naming incorrect  
❌ KV namespace binding missing  
⚠️ Automatic deployments paused  

## Required Actions

### 1. Fix Environment Variable Names

**Current (WRONG):**
- `SUPABASE_PUBLIC_KEY` ❌

**Should be:**
- `PUBLIC_SUPABASE_KEY` ✅

**How to fix:**
1. Go to Settings > Environment variables
2. Delete `SUPABASE_PUBLIC_KEY`
3. Add new variable: `PUBLIC_SUPABASE_KEY` with the same value

### 2. Add Missing Environment Variables

Go to **Settings > Environment variables** and add:

#### For Production Environment:

| Variable Name | Value | Type |
|--------------|-------|------|
| `PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxx.supabase.co`) | Secret |
| `PUBLIC_SUPABASE_KEY` | Your Supabase anon/public key | Secret |
| `SUPABASE_URL` | Same as PUBLIC_SUPABASE_URL | Secret |
| `SUPABASE_KEY` | Same as PUBLIC_SUPABASE_KEY | Secret |
| `GROQ_API_KEY` | Your GROQ API key | Secret |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Plaintext |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | Plaintext |

**Note:** You can use the same Supabase values for both PUBLIC_ and non-PUBLIC_ versions since you're using the anon key.

### 3. Configure KV Namespace Binding (CRITICAL)

Your application requires a KV namespace for session storage.

**Steps:**
1. Go to **Settings > Functions**
2. Scroll to **KV namespace bindings**
3. Click **Add binding**
4. Configure:
   - **Variable name:** `SESSION`
   - **KV namespace:** Create new namespace
     - Click "Create a new namespace"
     - Name: `SESSION` (or `10xdevs-sessions`)
     - Click Create
5. Click **Save**

**Why this is critical:** Your build logs show:
```
[@astrojs/cloudflare] Enabling sessions with Cloudflare KV with the "SESSION" KV binding.
```

Without this binding, your authentication and session management will fail at runtime.

### 4. Re-enable Automatic Deployments (Optional)

If you want GitHub pushes to automatically deploy:

1. Go to **Settings > Builds & deployments**
2. Find "Automatic deployments" section
3. Click **Enable automatic deployments**

**Note:** With GitHub Actions handling deployments, you might want to keep this paused to avoid duplicate deployments.

### 5. Verify GitHub Action Configuration

Your GitHub Action should now work since the project exists. Verify these secrets are set in GitHub:

Go to: `https://github.com/szalaj10/10xdevs-project/settings/secrets/actions`

Required secrets:
- ✅ `CLOUDFLARE_API_TOKEN`
- ✅ `CLOUDFLARE_ACCOUNT_ID`
- ✅ `CLOUDFLARE_PROJECT_NAME` (should be: `10xdevs-project`)
- ✅ `PUBLIC_SUPABASE_URL`
- ✅ `PUBLIC_SUPABASE_KEY`
- ✅ `GROQ_API_KEY`
- ⚠️ `GROQ_MODEL` (optional)
- ⚠️ `GROQ_BASE_URL` (optional)

## Testing After Configuration

### 1. Test Current Deployment

Visit: `https://10xdevs-project-em1.pages.dev`

Try these actions:
- [ ] Homepage loads
- [ ] Can navigate to login page
- [ ] Can attempt login (will fail if env vars are wrong)
- [ ] Check browser console for errors

### 2. Test GitHub Action Deployment

After fixing the configuration:

1. Make a small change to your code (e.g., update README)
2. Commit and push to `master` branch
3. Go to GitHub Actions tab
4. Watch the deployment workflow
5. Should complete successfully now

### 3. Verify Session Storage

After adding KV binding:
1. Try to log in to your app
2. Session should persist across page reloads
3. Check Cloudflare Dashboard > KV > SESSION namespace for stored sessions

## Common Issues After Configuration

### Issue: "Cannot read properties of undefined" errors

**Cause:** Environment variables not loaded correctly  
**Fix:** 
- Verify variable names are exactly correct (case-sensitive)
- Redeploy after adding variables
- Check Cloudflare Pages logs

### Issue: "Session storage not available"

**Cause:** KV namespace binding not configured  
**Fix:** 
- Add SESSION binding as described above
- Redeploy the application

### Issue: Login fails with Supabase errors

**Cause:** Incorrect Supabase credentials  
**Fix:**
- Verify `PUBLIC_SUPABASE_URL` is your actual project URL
- Verify `PUBLIC_SUPABASE_KEY` is the anon/public key (not service role key)
- Check Supabase Dashboard > Settings > API for correct values

### Issue: AI features not working

**Cause:** GROQ API key missing or invalid  
**Fix:**
- Add `GROQ_API_KEY` to environment variables
- Verify key is valid at https://console.groq.com/
- Check Cloudflare logs for GROQ API errors

## Deployment Methods

You now have two ways to deploy:

### Method 1: GitHub Actions (Recommended)
- Push to `master` branch
- GitHub Action builds and deploys automatically
- Full CI/CD with tests and linting

### Method 2: Direct Upload via Wrangler
```bash
npm run build
npx wrangler pages deploy dist --project-name=10xdevs-project
```

### Method 3: Git Integration (Currently Paused)
- Can be enabled in Cloudflare Dashboard
- Cloudflare builds and deploys on git push
- Not recommended if using GitHub Actions (causes duplicate builds)

## Final Checklist

Before considering the setup complete:

- [ ] All environment variables added with correct names
- [ ] `SUPABASE_PUBLIC_KEY` renamed to `PUBLIC_SUPABASE_KEY`
- [ ] KV namespace binding `SESSION` configured
- [ ] Test the deployed application
- [ ] Verify login/authentication works
- [ ] Verify AI flashcard generation works
- [ ] GitHub Action runs successfully
- [ ] No errors in browser console
- [ ] No errors in Cloudflare Pages logs

## Getting Environment Variable Values

If you don't have the values handy:

### Supabase:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings > API
4. Copy:
   - **URL** → `PUBLIC_SUPABASE_URL`
   - **anon/public key** → `PUBLIC_SUPABASE_KEY`

### GROQ:
1. Go to https://console.groq.com/
2. Go to API Keys
3. Create new key or copy existing key
4. Use as `GROQ_API_KEY`

## Next Steps After Configuration

1. **Fix the environment variables** (most critical)
2. **Add KV namespace binding** (critical for sessions)
3. **Test the application** thoroughly
4. **Run GitHub Action** to verify CI/CD works
5. **Monitor logs** for any runtime errors
6. **Consider custom domain** (optional)

## Support

If you encounter issues after making these changes:
- Check Cloudflare Pages logs: Settings > Functions > Logs
- Check browser console for client-side errors
- Review GitHub Actions logs for deployment errors
- Verify all secrets and variables are correct

