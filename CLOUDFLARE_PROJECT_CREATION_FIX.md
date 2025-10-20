# Cloudflare Pages Project Creation Fix

## Problem

The GitHub Actions deployment is failing with the error:

```
Project not found. The specified project name does not match any of your existing projects. [code: 8000007]
```

This means the Cloudflare Pages project doesn't exist yet. The project must be created in Cloudflare Dashboard **before** the GitHub Action can deploy to it.

## Solution

You have two options to fix this:

### Option 1: Create Project Manually in Cloudflare Dashboard (Recommended)

This is the recommended approach as it gives you full control over the project configuration.

#### Steps:

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com/
   - Log in to your account

2. **Navigate to Workers & Pages**
   - Click on **Workers & Pages** in the left sidebar
   - Click **Create application**
   - Click **Pages** tab
   - Click **Create project**

3. **Create a Direct Upload Project**
   - Click **Upload assets**
   - Enter your project name (must match `CLOUDFLARE_PROJECT_NAME` secret in GitHub)
   - Click **Create project**

4. **Configure Environment Variables**
   
   After creating the project, go to **Settings** > **Environment variables** and add:

   **Production environment:**
   - `PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `PUBLIC_SUPABASE_KEY` = Your Supabase anon key
   - `SUPABASE_URL` = Same as PUBLIC_SUPABASE_URL
   - `SUPABASE_KEY` = Same as PUBLIC_SUPABASE_KEY
   - `GROQ_API_KEY` = Your GROQ API key
   - `GROQ_MODEL` = `llama-3.3-70b-versatile` (or your preferred model)
   - `GROQ_BASE_URL` = `https://api.groq.com/openai/v1`

5. **Configure KV Binding for Sessions**
   
   Go to **Settings** > **Functions** > **KV namespace bindings**:
   - Click **Add binding**
   - Variable name: `SESSION`
   - KV namespace: Create a new namespace called `SESSION` or select existing one
   - Click **Save**

6. **Re-run GitHub Action**
   - Go to your GitHub repository
   - Click **Actions** tab
   - Find the failed workflow run
   - Click **Re-run all jobs**

### Option 2: Use Wrangler CLI to Create Project

If you prefer command line, you can create the project using Wrangler:

#### Steps:

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Create the project**
   ```bash
   wrangler pages project create <your-project-name>
   ```
   Replace `<your-project-name>` with the value from your `CLOUDFLARE_PROJECT_NAME` secret.

4. **Configure environment variables via CLI**
   ```bash
   # Set production environment variables
   wrangler pages secret put PUBLIC_SUPABASE_URL --project-name=<your-project-name>
   wrangler pages secret put PUBLIC_SUPABASE_KEY --project-name=<your-project-name>
   wrangler pages secret put SUPABASE_URL --project-name=<your-project-name>
   wrangler pages secret put SUPABASE_KEY --project-name=<your-project-name>
   wrangler pages secret put GROQ_API_KEY --project-name=<your-project-name>
   wrangler pages secret put GROQ_MODEL --project-name=<your-project-name>
   wrangler pages secret put GROQ_BASE_URL --project-name=<your-project-name>
   ```

5. **Create KV namespace for sessions**
   ```bash
   # Create KV namespace
   wrangler kv:namespace create SESSION

   # Note the ID from the output, then bind it to your project
   # You'll need to do this in the Cloudflare Dashboard under Settings > Functions > KV namespace bindings
   ```

6. **Re-run GitHub Action**

## Verification Checklist

After creating the project, verify:

- [ ] Project exists in Cloudflare Dashboard under Workers & Pages
- [ ] Project name matches `CLOUDFLARE_PROJECT_NAME` GitHub secret
- [ ] All environment variables are configured in Cloudflare Pages settings
- [ ] KV namespace binding for `SESSION` is configured
- [ ] GitHub Action has necessary secrets:
  - [ ] `CLOUDFLARE_API_TOKEN`
  - [ ] `CLOUDFLARE_ACCOUNT_ID`
  - [ ] `CLOUDFLARE_PROJECT_NAME`
  - [ ] `PUBLIC_SUPABASE_URL`
  - [ ] `PUBLIC_SUPABASE_KEY`
  - [ ] `GROQ_API_KEY`
  - [ ] `GROQ_MODEL` (optional)
  - [ ] `GROQ_BASE_URL` (optional)

## Important Notes

### Project Name Requirements

The project name must:
- Only contain lowercase letters, numbers, and hyphens
- Not start or end with a hyphen
- Be between 1 and 58 characters
- Match exactly between GitHub secret and Cloudflare project

### Environment Variables vs Secrets

**In GitHub Actions:**
- Use **Secrets** for sensitive data (API keys, tokens)
- These are passed to the build process and deployment

**In Cloudflare Pages:**
- Use **Environment Variables** for runtime configuration
- These are available to your application when it runs on Cloudflare

### KV Namespace for Sessions

The application uses Cloudflare KV for session storage. The build logs show:

```
[@astrojs/cloudflare] Enabling sessions with Cloudflare KV with the "SESSION" KV binding.
```

This means you **must** create a KV namespace binding called `SESSION` in your Cloudflare Pages project settings.

## After Successful Deployment

Once the deployment succeeds, your application will be available at:

```
https://<your-project-name>.pages.dev
```

You can also:
1. View deployment logs in Cloudflare Dashboard
2. Configure custom domains
3. Set up preview deployments for branches
4. Monitor analytics and performance

## Troubleshooting

### Still getting "Project not found" error?

1. **Verify project name matches exactly:**
   - GitHub Secret: `CLOUDFLARE_PROJECT_NAME`
   - Cloudflare Dashboard: Project name in Workers & Pages

2. **Check API token permissions:**
   - Token must have "Cloudflare Pages: Edit" permission
   - Token must be for the correct account

3. **Verify account ID:**
   - Must be the 32-character hash from Cloudflare Dashboard
   - Found in Dashboard > Overview > Account ID (right sidebar)

### Build succeeds but deployment fails?

1. Check if all environment variables are set in Cloudflare Pages
2. Verify KV namespace binding is configured
3. Check Cloudflare Pages logs for runtime errors

### Application doesn't work after deployment?

1. Check browser console for errors
2. Verify environment variables in Cloudflare Pages settings
3. Check that Supabase URL and keys are correct
4. Verify GROQ API key is valid

## Next Steps

After fixing the deployment:

1. Test the deployed application
2. Configure custom domain (optional)
3. Set up branch preview deployments (optional)
4. Monitor application logs and analytics
5. Consider setting up alerts for deployment failures

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

