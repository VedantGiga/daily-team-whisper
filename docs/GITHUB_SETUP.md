# GitHub Integration Setup Guide

This guide explains how to get GitHub API keys for the AutoBrief application.

## Step 1: Create a GitHub OAuth App

1. **Go to GitHub Settings**
   - Visit https://github.com/settings/developers
   - Click on "OAuth Apps" in the left sidebar
   - Click "New OAuth App"

2. **Fill in Application Details**
   ```
   Application name: AutoBrief
   Homepage URL: https://your-replit-url.replit.app
   Authorization callback URL: https://your-replit-url.replit.app/api/integrations/github/callback
   ```

3. **Get Your Credentials**
   - After creating the app, you'll see:
     - **Client ID** (public)
     - **Client Secret** (private - click "Generate a new client secret")

## Step 2: Add Secrets to Replit

In your Replit project:

1. Click the "Secrets" tab in the left sidebar (lock icon)
2. Add these environment variables:

```
Key: GITHUB_CLIENT_ID
Value: your_client_id_here

Key: GITHUB_CLIENT_SECRET  
Value: your_client_secret_here
```

## Step 3: Update Callback URL

Once your Replit app is running:
1. Copy your Replit app URL (ends with .replit.app)
2. Go back to your GitHub OAuth app settings
3. Update the Authorization callback URL to:
   `https://YOUR_REPLIT_URL.replit.app/api/integrations/github/callback`

## Step 4: Test the Integration

1. Navigate to `/integrations` in your app
2. Click "Connect" on the GitHub integration
3. You should be redirected to GitHub to authorize the app
4. After authorization, you'll be redirected back with a connected status

## GitHub API Permissions

The app requests these scopes:
- **user**: Read user profile information
- **repo**: Access repository data, commits, pull requests
- **read:org**: Read organization membership

## Troubleshooting

**Error: "GitHub OAuth not configured"**
- Make sure `GITHUB_CLIENT_ID` is set in Secrets

**Error: "Failed to connect GitHub account"**
- Check that `GITHUB_CLIENT_SECRET` is correctly set
- Verify callback URL matches exactly (including https://)

**Error: "Invalid redirect_uri"**
- Update the Authorization callback URL in your GitHub OAuth app settings
- Make sure it matches your Replit domain exactly

## Security Notes

- Never commit client secrets to code
- Use Replit Secrets for all sensitive credentials
- The OAuth flow handles token exchange securely
- Access tokens are stored encrypted in the database