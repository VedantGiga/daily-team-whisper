# Google Calendar OAuth Setup Guide

## Current Status
✓ Google API keys configured
✓ OAuth flow implemented
⚠️ Redirect URI needs registration in Google Cloud Console

## Required Setup Steps

### 1. Access Google Cloud Console
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Select your project

### 2. Configure OAuth Credentials
- Navigate to "APIs & Services" > "Credentials"
- Find OAuth 2.0 Client ID: `913646208792-hltu1sh6mmvi1m0em9cpplcq0nn4tich.apps.googleusercontent.com`
- Click "Edit" on that credential

### 3. Add Redirect URI
Add this exact URL to "Authorized redirect URIs":
```
https://4b7a6054-dd6f-439e-87c9-b47b7483afa8-00-2ikofegq1v7eb.kirk.replit.dev/api/integrations/google-calendar/callback
```

### 4. Save and Wait
- Click "Save" in Google Cloud Console
- Wait 2-3 minutes for changes to propagate

## Testing
After setup, test the Google Calendar integration in the AutoBrief dashboard. The connection should work without OAuth policy errors.

## Current Domain
This configuration is specific to the current Replit domain. If the domain changes, update the redirect URI accordingly.