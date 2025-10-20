# Cloudflare Project Name Debugging Guide

## The Problem

You're getting error code 8000007: "Project not found" which means there's a mismatch between:
- The project name in Cloudflare
- The `CLOUDFLARE_PROJECT_NAME` secret in GitHub

## Step-by-Step Debug Process

### Step 1: Get EXACT Project Name from Cloudflare

1. Go to: https://dash.cloudflare.com/
2. Click **Workers & Pages** in left sidebar
3. Look at your project in the list
4. The project name is shown in the list - it should be `10xdevs-project`
5. **Click on the project** to open it
6. Look at the URL in your browser address bar
7. The URL will be: `https://dash.cloudflare.com/[account-id]/pages/view/[PROJECT-NAME]`
8. Copy the `[PROJECT-NAME]` part from the URL - this is the EXACT name

### Step 2: Verify GitHub Secret

1. Go to: https://github.com/szalaj10/10xdevs-project/settings/secrets/actions
2. Find `CLOUDFLARE_PROJECT_NAME`
3. Click the **pencil icon** (edit)
4. You'll see a text box with the current value
5. **Delete everything** in the text box
6. Type (or paste) the EXACT project name from Step 1
7. Make sure there are NO:
   - Spaces before or after
   - Capital letters
   - Special characters except hyphens
8. Click **Update secret**

### Step 3: Common Mistakes to Avoid

❌ **Wrong:** `10xdevs-project-em1` (this is the domain, not project name)
❌ **Wrong:** `10xdevs-project-em1.pages.dev` (this is the full domain)
❌ **Wrong:** `10xDevs-Project` (wrong capitalization)
❌ **Wrong:** `10xdevs-project ` (space at the end)
❌ **Wrong:** ` 10xdevs-project` (space at the beginning)
✅ **Correct:** `10xdevs-project`

### Step 4: Alternative - Use Wrangler CLI to List Projects

If you have Wrangler CLI installed locally:

```bash
# Login to Cloudflare
wrangler login

# List all your Pages projects
wrangler pages project list
```

This will show you the EXACT names of all your projects.

### Step 5: Create Test Script

Create a file `test-cloudflare.sh` in your project root:

```bash
#!/bin/bash

# Replace these with your actual values
CLOUDFLARE_API_TOKEN="your-token-here"
CLOUDFLARE_ACCOUNT_ID="your-account-id-here"

echo "Testing Cloudflare API connection..."
echo ""

# List all Pages projects
curl -X GET "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" | jq '.result[] | .name'

echo ""
echo "These are your EXACT project names. Use one of these in CLOUDFLARE_PROJECT_NAME."
```

Run it:
```bash
chmod +x test-cloudflare.sh
./test-cloudflare.sh
```

This will show you the exact project names from Cloudflare's API.

### Step 6: Manual Verification

Try deploying manually from your local machine:

```bash
# Install wrangler globally
npm install -g wrangler

# Login
wrangler login

# Build your project
npm run build

# Try to deploy (replace with your project name)
wrangler pages deploy dist --project-name=10xdevs-project
```

If this works locally but fails in GitHub Actions, then the GitHub secret is definitely wrong.

## Most Likely Solution

Based on your screenshots, the project name should be exactly:

```
10xdevs-project
```

**NOT:**
- `10xdevs-project-em1`
- `10xdevs-project-em1.pages.dev`

The `-em1` part is automatically added by Cloudflare to the domain name, but it's NOT part of the project name.

## Final Checklist

Before re-running the GitHub Action:

- [ ] Opened Cloudflare Dashboard and confirmed project name
- [ ] Copied project name from URL or project list
- [ ] Opened GitHub Secrets page
- [ ] Edited `CLOUDFLARE_PROJECT_NAME` secret
- [ ] Deleted old value completely
- [ ] Pasted exact project name (no spaces, all lowercase)
- [ ] Clicked "Update secret"
- [ ] Waited 10 seconds for GitHub to save the change
- [ ] Re-ran the GitHub Action

## Still Not Working?

If it still doesn't work after following all steps above, there might be one of these issues:

### Issue 1: Project was deleted

Check if the project still exists in Cloudflare Dashboard. If not, create it again:

1. Go to Workers & Pages
2. Click "Create application"
3. Click "Pages"
4. Click "Upload assets"
5. Enter project name: `10xdevs-project`
6. Click "Create project"

### Issue 2: Wrong Cloudflare Account

Make sure your `CLOUDFLARE_ACCOUNT_ID` matches the account where the project exists:

1. In Cloudflare Dashboard, click on your account name (top left)
2. Check which account you're in
3. The Account ID should be visible in the right sidebar
4. Verify this matches your GitHub secret `CLOUDFLARE_ACCOUNT_ID`

### Issue 3: API Token Permissions

Your API token might not have permission to access this project:

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Find your token
3. Click "Edit"
4. Verify it has:
   - Permission: **Account** > **Cloudflare Pages** > **Edit**
   - Account Resources: **Include** > Your account
5. If not, create a new token with these permissions

## Debug Output

Add this temporary step to your GitHub workflow to see what's being sent:

```yaml
- name: Debug project name
  run: |
    echo "Project name length: ${#CLOUDFLARE_PROJECT_NAME}"
    echo "Project name (hex): $(echo -n "$CLOUDFLARE_PROJECT_NAME" | xxd -p)"
    echo "First char: $(echo -n "$CLOUDFLARE_PROJECT_NAME" | cut -c1)"
    echo "Last char: $(echo -n "$CLOUDFLARE_PROJECT_NAME" | rev | cut -c1)"
  env:
    CLOUDFLARE_PROJECT_NAME: ${{ secrets.CLOUDFLARE_PROJECT_NAME }}
```

This will help identify hidden characters or spaces.

## Contact Support

If nothing works, you can:

1. Check Cloudflare Community: https://community.cloudflare.com/
2. Check Wrangler Issues: https://github.com/cloudflare/workers-sdk/issues
3. Verify Cloudflare Status: https://www.cloudflarestatus.com/

## Expected Success Output

When it works, you should see:

```
✨ Deployment complete! Take a peek over at
https://10xdevs-project-em1.pages.dev
```

The deployment URL will have the `-em1` suffix, but the project name doesn't.

