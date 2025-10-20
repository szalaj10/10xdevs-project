# ⚠️ Cloudflare Pages Project Must Be Created First

## The Problem

The deployment is failing with:
```
Project not found. The specified project name does not match any of your existing projects. [code: 8000007]
```

This means **the Cloudflare Pages project doesn't exist yet** and needs to be created before the first deployment.

## Solution: Create the Project Manually

### Step 1: Go to Cloudflare Dashboard

1. Visit: https://dash.cloudflare.com/
2. Log in to your account
3. Click on **"Workers & Pages"** in the left sidebar

### Step 2: Create a New Pages Project

1. Click the **"Create application"** button
2. Select **"Pages"** tab
3. Click **"Create using direct upload"** (or connect to Git if you prefer)

### Step 3: Configure the Project

1. **Project name**: Enter the same name as your `CLOUDFLARE_PROJECT_NAME` secret
   - Use only lowercase letters, numbers, and hyphens
   - Example: `10xdevs-flashcards` or `my-flashcards-app`

2. **Production branch**: `main` (or `master` if that's your default branch)

3. Click **"Create project"**

### Step 4: Skip Initial Deployment

You can skip the initial deployment setup - the GitHub Actions workflow will handle all deployments automatically.

### Step 5: Configure Environment Variables (Important!)

After creating the project, you need to add environment variables:

1. In your Cloudflare Pages project, go to **Settings** > **Environment variables**
2. Add the following variables for **Production**:

   ```
   PUBLIC_SUPABASE_URL=your-supabase-url
   PUBLIC_SUPABASE_KEY=your-supabase-anon-key
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-service-role-key
   GROQ_API_KEY=your-groq-api-key
   GROQ_MODEL=llama-3.3-70b-versatile
   GROQ_BASE_URL=https://api.groq.com/openai/v1
   ```

3. Click **"Save"**

### Step 6: Configure KV Namespace for Sessions (Required!)

Your app uses Cloudflare KV for session storage. You need to create and bind a KV namespace:

1. Go to **Workers & Pages** > **KV**
2. Click **"Create a namespace"**
3. Name it: `SESSION` (or any name you prefer)
4. Click **"Add"**

Then bind it to your Pages project:

1. Go back to your Pages project
2. Go to **Settings** > **Functions** > **KV namespace bindings**
3. Click **"Add binding"**
4. Variable name: `SESSION` (this must match what's in your code)
5. KV namespace: Select the namespace you just created
6. Click **"Save"**

### Step 7: Trigger a New Deployment

Now that the project exists and is configured:

1. Push a new commit to your repository, or
2. Re-run the failed GitHub Actions workflow

The deployment should now succeed!

## Alternative: Use Wrangler CLI to Create Project

If you prefer to use the command line:

```bash
# Install wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create the Pages project
wrangler pages project create YOUR_PROJECT_NAME

# List your projects to verify
wrangler pages project list
```

## Verify Your Configuration

After creating the project, verify these match:

- ✅ GitHub Secret `CLOUDFLARE_PROJECT_NAME` = Cloudflare Pages project name
- ✅ GitHub Secret `CLOUDFLARE_ACCOUNT_ID` = Your Cloudflare Account ID
- ✅ GitHub Secret `CLOUDFLARE_API_TOKEN` = Valid API token with Pages Edit permission
- ✅ Cloudflare Pages project has all environment variables configured
- ✅ KV namespace `SESSION` is created and bound to the project

## Next Steps

Once the project is created and configured:

1. The GitHub Actions workflow will automatically deploy on every push to `main`/`master`
2. Your app will be available at: `https://YOUR_PROJECT_NAME.pages.dev`
3. You can configure a custom domain in Cloudflare Pages settings

## Need Help?

- Cloudflare Pages Documentation: https://developers.cloudflare.com/pages/
- Cloudflare KV Documentation: https://developers.cloudflare.com/kv/
- Wrangler CLI Documentation: https://developers.cloudflare.com/workers/wrangler/

---

**Important**: The project MUST be created before the first deployment. GitHub Actions cannot create the project automatically - this is a Cloudflare limitation.

