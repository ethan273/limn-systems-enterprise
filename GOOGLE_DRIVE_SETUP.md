# Google Drive Integration Setup Guide

## Overview
This guide explains how to set up Google Drive integration for the Limn Systems Enterprise application using a **Service Account** for always-connected corporate folder access.

## Why Service Account vs OAuth?

### OAuth 2.0 (Current - WRONG APPROACH)
- ❌ Each user must authenticate separately
- ❌ Requires users to have Google accounts
- ❌ Tokens expire and need refresh
- ❌ Users can revoke access
- ❌ Complex permission management

### Service Account (RECOMMENDED)
- ✅ Always connected - no user authentication needed
- ✅ Single configuration for entire application
- ✅ No token expiration issues
- ✅ Corporate control over access
- ✅ Simpler implementation and maintenance

## Setup Steps

### Step 1: Create Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create new one)
3. Navigate to **IAM & Admin > Service Accounts**
4. Click **Create Service Account**
5. Enter details:
   - **Name**: `limn-enterprise-drive-service`
   - **Description**: `Service account for Limn Enterprise Google Drive integration`
6. Click **Create and Continue**
7. **Grant roles** (optional for this use case, skip)
8. Click **Done**

### Step 2: Create and Download Service Account Key

1. Click on the newly created service account
2. Go to **Keys** tab
3. Click **Add Key > Create New Key**
4. Select **JSON** format
5. Click **Create**
6. **Download the JSON file** (keep it secure!)
7. Rename the file to `google-drive-service-account.json`

### Step 3: Share Google Drive Folder with Service Account

1. Open the corporate Google Drive folder in browser
2. Copy the folder ID from URL:
   ```
   https://drive.google.com/drive/folders/[FOLDER_ID_HERE]
   ```
3. Click **Share** on the folder
4. Add the service account email (from the JSON file):
   ```
   limn-enterprise-drive-service@[PROJECT-ID].iam.gserviceaccount.com
   ```
5. Grant **Editor** permissions
6. Uncheck "Notify people"
7. Click **Share**

### Step 4: Configure Environment Variables

Add to `.env.local`:

```bash
# Google Drive Service Account Configuration
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=limn-enterprise-drive-service@[PROJECT-ID].iam.gserviceaccount.com
GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[KEY_HERE]\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=10AVDTYeAFUo6mQ2ux4gGgdPYiZnJSjwL

# Legacy OAuth (can be removed after service account implementation)
# GOOGLE_DRIVE_CLIENT_ID=...
# GOOGLE_DRIVE_CLIENT_SECRET=...
```

**⚠️ IMPORTANT:** The private key must have literal `\n` characters (not actual newlines). Copy from the JSON file's `private_key` field as-is.

### Step 5: Place Service Account JSON File (Optional)

Alternatively, you can use the entire JSON file:

1. Place `google-drive-service-account.json` in project root
2. Add to `.gitignore`:
   ```
   google-drive-service-account.json
   ```
3. Use in code:
   ```typescript
   const credentials = require('../google-drive-service-account.json');
   ```

## Testing the Integration

After setup, test the integration:

```bash
npm run dev
```

Navigate to `/design/documents` - Google Drive should be automatically connected without any manual "Connect" button.

## Security Best Practices

1. **Never commit the service account JSON file** - add to `.gitignore`
2. **Never commit private key to git** - use environment variables
3. **Rotate service account keys** regularly (every 90 days recommended)
4. **Use least privilege** - only grant necessary permissions
5. **Monitor service account usage** in Google Cloud Console
6. **Revoke old keys** after rotation

## Production Deployment

For production (e.g., Vercel, AWS):

1. Add environment variables to hosting platform
2. For `GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY`, ensure `\n` is preserved
3. Alternatively, use secrets management (AWS Secrets Manager, Vercel Secure Variables)
4. Test in staging environment first

## Folder Structure Recommendation

```
Corporate Google Drive Folder (ID: 10AVDTYeAFUo6mQ2ux4gGgdPYiZnJSjwL)
├── Design Files/
│   ├── Concepts/
│   ├── Prototypes/
│   └── Final Designs/
├── Shop Drawings/
├── Customer Documents/
└── Production Files/
```

## Troubleshooting

### "Insufficient Permission" Error
- Verify service account email has Editor access to the folder
- Check folder ID is correct in environment variables

### "Invalid Grant" Error
- Verify private key format (must include `\n` characters)
- Ensure no extra spaces or newlines in environment variable

### Files Not Appearing
- Check folder ID matches the shared folder
- Verify service account permissions
- Check file permissions in Google Drive

## Migration from OAuth to Service Account

1. Implement service account integration (see implementation files)
2. Test thoroughly in development
3. Migrate existing files (if any) to new folder structure
4. Update database records to remove user-specific oauth_tokens
5. Remove OAuth code after confirming service account works
6. Update documentation

## Support

For issues with Google Drive integration:
- Check Google Cloud Console for service account status
- Review application logs for API errors
- Contact IT team for corporate Google Workspace access
