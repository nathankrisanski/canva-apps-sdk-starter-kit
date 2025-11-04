# Azure AD OAuth Setup Guide for Canva App

## Overview
This guide will help you set up Azure AD OAuth authentication for "The Agency Axis" Canva app.

## Prerequisites
- Access to Azure Portal (Azure Active Directory admin)
- Access to Canva Developer Portal
- Your app's development URL (typically `http://localhost:8080` or similar)

---

## Step 1: Azure AD Application Setup

### 1.1 Create/Configure Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Either create a new registration or use an existing one:
   - **Name**: `The Agency Axis - Canva Integration` (or similar)
   - **Supported account types**: Choose based on your needs (usually "Single tenant")
   - **Redirect URI**: Leave blank for now (we'll add it after Canva configuration)

### 1.2 Get Application Details

1. From your app registration overview page, copy:
   - **Application (client) ID** - You'll need this for Canva
   - **Directory (tenant) ID** - You'll need this for Canva

### 1.3 Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description (e.g., "Canva Integration Secret")
4. Set expiration (recommended: 12-24 months)
5. Click **Add**
6. **IMPORTANT**: Copy the secret **Value** immediately (you won't see it again!)

### 1.4 Configure API Permissions (Optional but Recommended)

1. Go to **API permissions**
2. Add permissions as needed:
   - Microsoft Graph → Delegated → `openid`
   - Microsoft Graph → Delegated → `profile`
   - Microsoft Graph → Delegated → `email`
3. Click **Grant admin consent** if required

---

## Step 2: Canva Developer Portal Configuration

### 2.1 Access Your App Settings

1. Go to [Canva Developer Portal](https://www.canva.com/developers/apps)
2. Sign in with your Canva account
3. Find and select **"The Agency Axis"** app

### 2.2 Configure OAuth Provider

1. Click **"Authentication"** in the left sidebar
2. Fill in the OAuth configuration form:

#### Required Fields:

**Provider (Issuer URL)**:
```
https://login.microsoftonline.com/{YOUR_TENANT_ID}/v2.0
```
Replace `{YOUR_TENANT_ID}` with your actual Azure Tenant ID from Step 1.2

**Client ID**:
```
{YOUR_AZURE_CLIENT_ID}
```
Your Application (client) ID from Step 1.2

**Client Secret**:
```
{YOUR_CLIENT_SECRET_VALUE}
```
The secret value you copied in Step 1.3

**Authorization Server URL**:
```
https://login.microsoftonline.com/{YOUR_TENANT_ID}/oauth2/v2.0/authorize
```

**Token Exchange URL**:
```
https://login.microsoftonline.com/{YOUR_TENANT_ID}/oauth2/v2.0/token
```

**Revocation Exchange URL** (Optional but recommended):
```
https://login.microsoftonline.com/{YOUR_TENANT_ID}/oauth2/v2.0/logout
```

**PKCE**: Keep enabled (checked) - this is the default and recommended

### 2.3 Save and Get Redirect URI

1. Click **Save** to save the OAuth configuration
2. After saving, Canva will display a **Redirect URI**
   - It will look like: `https://api.canva.com/oauth/redirect/...`
3. **Copy this URI** - you'll need it for the next step

---

## Step 3: Update Azure AD Redirect URI

### 3.1 Add Canva Redirect URI to Azure AD

1. Go back to Azure Portal → Your app registration
2. Click **Authentication** in the left sidebar
3. Under **Platform configurations**, click **Add a platform**
4. Select **Web**
5. Paste the Canva Redirect URI you copied in Step 2.3
6. Under **Implicit grant and hybrid flows**, ensure these are **NOT** checked (Canva uses authorization code flow)
7. Click **Configure**

### 3.2 Verify Configuration

Ensure the redirect URI is listed under **Web** platform in the Authentication section.

---

## Step 4: Test the Integration

### 4.1 Start Your Development Server

```bash
npm start
```

### 4.2 Open Your App in Canva

1. Go to Canva and open a design
2. Open your app from the apps menu
3. The app should now:
   - Show "Connecting..." briefly
   - Display the Azure AD OAuth consent screen
   - After clicking "Connect", authenticate you
   - Load the main app content with your name displayed

### 4.3 Verify User Information

After successful login, check the browser console for:
```
[MicrosoftAuthService] Authentication successful!
[MicrosoftAuthService] Decoded token payload: { ... }
```

The app should display:
- Your display name in the header
- Proper user information from Azure AD

---

## Troubleshooting

### Issue: "No access token received"

**Cause**: OAuth provider not configured in Canva Developer Portal

**Solution**:
- Verify Steps 2.1-2.3 are completed correctly
- Check that all URLs use your correct Tenant ID
- Ensure Client ID and Secret are correct

### Issue: "Redirect URI mismatch"

**Cause**: Azure AD redirect URI doesn't match Canva's redirect URI

**Solution**:
- Go to Azure Portal → Authentication
- Ensure the exact redirect URI from Canva is added
- No trailing slashes or extra characters

### Issue: "AADSTS50011: The redirect URI specified does not match"

**Cause**: Canva's redirect URI is not in Azure AD's allowed list

**Solution**:
- Double-check Step 3.1
- Ensure you added the redirect URI to the **Web** platform (not SPA)
- Wait a few minutes for Azure AD changes to propagate

### Issue: Token doesn't contain user info

**Cause**: Missing API permissions or scopes

**Solution**:
- Verify Step 1.4 (API permissions)
- Ensure `profile` and `email` scopes are requested
- Grant admin consent if required

---

## Security Considerations

1. **Never commit secrets to git**: Keep your Client Secret secure
2. **Rotate secrets regularly**: Set expiration dates and rotate before expiry
3. **Use appropriate account types**: Single tenant is more secure for internal apps
4. **Monitor authentication logs**: Check Azure AD sign-in logs regularly
5. **Implement proper error handling**: Don't expose sensitive error details to users

---

## Two-Level Authentication Flow

This app implements a two-level authentication system:

1. **Level 1: Azure AD OAuth** (User Authentication)
   - User authenticates via Azure AD through Canva's OAuth flow
   - Receives an access token containing user identity

2. **Level 2: Middleware API Token** (API Authentication)
   - After user login, the app generates/retrieves an API token
   - This token is used to authenticate with the middleware API
   - Configured via API Config Setup in the app

Both authentication levels are required for full app functionality.

---

## Additional Resources

- [Canva OAuth Documentation](https://www.canva.dev/docs/apps/authenticating-users/oauth/)
- [Azure AD OAuth 2.0 Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)

---

## Need Help?

If you encounter issues not covered in this guide:
1. Check browser console for detailed error logs
2. Review Azure AD sign-in logs in Azure Portal
3. Verify all configuration values match exactly
4. Ensure your app has the latest code from the repository
