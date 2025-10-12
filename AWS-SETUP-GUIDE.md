# AWS Secrets Manager Setup Guide

Complete step-by-step guide to set up AWS Secrets Manager for your API credentials system.

---

## Step 1: Create AWS Account (15 minutes)

### 1.1 Sign Up for AWS
1. Go to https://aws.amazon.com
2. Click **"Create an AWS Account"** (orange button, top right)
3. Enter email address (use your business email)
4. Choose account name: `limn-systems-enterprise`
5. Click **"Verify email address"**

### 1.2 Check Email & Verify
1. Open your email inbox
2. Find AWS verification code (check spam if not in inbox)
3. Enter the 6-digit code in AWS
4. Click **"Verify"**

### 1.3 Create Root Password
1. Create a strong password (minimum 8 characters)
2. **IMPORTANT:** Save this in your password manager
3. Click **"Continue"**

### 1.4 Enter Contact Information
1. Select account type: **"Business"**
2. Fill in:
   - Business name: `Limn Systems`
   - Phone number: Your business phone
   - Address: Your business address
3. Check the AWS Customer Agreement checkbox
4. Click **"Create Account and Continue"**

### 1.5 Add Payment Method
1. Enter credit/debit card information
2. **Note:** You won't be charged unless you exceed free tier
3. AWS will charge $1 for verification (refunded immediately)
4. Click **"Verify and Add"**

### 1.6 Phone Verification
1. Enter phone number for SMS/call verification
2. Choose verification method (SMS recommended)
3. Enter the 4-digit code received
4. Click **"Continue"**

### 1.7 Select Support Plan
1. Choose **"Basic Support - Free"** (sufficient for now)
2. Click **"Complete sign up"**

### 1.8 Account Activation
1. Wait 5-10 minutes for account activation
2. You'll receive email: "Welcome to Amazon Web Services"
3. Click **"Sign in to the Console"**

✅ **AWS Account Created!**

---

## Step 2: Enable MFA (Multi-Factor Authentication) - 5 minutes

**Why?** Protect your root account with 2FA.

### 2.1 Access Security Credentials
1. Click your account name (top right)
2. Select **"Security credentials"**

### 2.2 Set Up MFA
1. Scroll to **"Multi-factor authentication (MFA)"**
2. Click **"Assign MFA device"**
3. Choose device name: `limn-root-mfa`
4. Select **"Authenticator app"**
5. Click **"Next"**

### 2.3 Configure Authenticator App
1. Download authenticator app (if you don't have one):
   - **Google Authenticator** (iOS/Android)
   - **Authy** (iOS/Android/Desktop)
   - **1Password** (if you use 1Password)

2. In AWS console, click **"Show QR code"**
3. Scan QR code with authenticator app
4. Enter two consecutive MFA codes from app
5. Click **"Add MFA"**

✅ **MFA Enabled!** Your root account is now protected.

---

## Step 3: Create IAM User (Don't Use Root!) - 10 minutes

**Why?** Never use root account for daily tasks. Create IAM user instead.

### 3.1 Access IAM
1. In AWS Console search bar (top), type: `IAM`
2. Click **"IAM"** (Identity and Access Management)

### 3.2 Create IAM User
1. Left sidebar → Click **"Users"**
2. Click **"Create user"** (orange button)
3. User name: `limn-admin`
4. Check ✓ **"Provide user access to the AWS Management Console"**
5. Select **"I want to create an IAM user"**
6. Console password: **"Custom password"**
7. Enter a strong password
8. **Uncheck** "Users must create a new password at next sign-in"
9. Click **"Next"**

### 3.3 Set Permissions
1. Select **"Attach policies directly"**
2. In search box, type: `SecretsManager`
3. Check ✓ **SecretsManagerReadWrite**
4. In search box, type: `CloudWatch`
5. Check ✓ **CloudWatchLogsReadOnlyAccess**
6. Click **"Next"**

### 3.4 Review and Create
1. Review user details
2. Click **"Create user"**
3. **IMPORTANT:** On success page, click **"Download .csv file"**
4. Save this file securely (contains password)
5. Click **"Return to users list"**

### 3.5 Enable MFA for IAM User
1. Click on `limn-admin` user
2. Go to **"Security credentials"** tab
3. Scroll to **"Multi-factor authentication (MFA)"**
4. Click **"Assign MFA device"**
5. Device name: `limn-admin-mfa`
6. Follow same steps as root MFA setup

✅ **IAM User Created with MFA!**

---

## Step 4: Create Access Keys for API - 5 minutes

**Why?** Your app needs programmatic access to AWS.

### 4.1 Generate Access Keys
1. Still in IAM → Users → `limn-admin`
2. Go to **"Security credentials"** tab
3. Scroll to **"Access keys"** section
4. Click **"Create access key"**

### 4.2 Choose Use Case
1. Select **"Application running outside AWS"**
2. Check ✓ confirmation checkbox at bottom
3. Click **"Next"**

### 4.3 Add Description (Optional)
1. Description tag: `Limn Enterprise API Credentials Manager`
2. Click **"Create access key"**

### 4.4 Save Access Keys
**⚠️ CRITICAL: This is the ONLY time you'll see the Secret Access Key!**

1. Click **"Download .csv file"** (saves both keys)
2. **Also copy values manually:**
   - Access key ID: `AKIA...` (20 characters)
   - Secret access key: `wJalrXUtn...` (40 characters)
3. Click **"Done"**

### 4.5 Store Keys Securely
Save these in your `.env` file (we'll add them later):
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalrXUtn...
AWS_REGION=us-east-1
```

✅ **Access Keys Created!**

---

## Step 5: Set Up Secrets Manager - 5 minutes

### 5.1 Access Secrets Manager
1. In AWS Console search bar, type: `Secrets Manager`
2. Click **"AWS Secrets Manager"**

### 5.2 Familiarize with Interface
1. Click **"Store a new secret"** (just to see the interface)
2. Click **"Cancel"** (we'll create secrets via code)

### 5.3 Check Region
1. Top right corner shows region (e.g., "N. Virginia")
2. Click region dropdown
3. Select **"US East (N. Virginia)"** - `us-east-1`
   - **Why?** Lowest latency if you're on East Coast
   - Or choose region closest to you

✅ **Secrets Manager Ready!**

---

## Step 6: Configure AWS CLI (Optional but Recommended) - 5 minutes

**Why?** Test AWS connection before coding.

### 6.1 Install AWS CLI
**macOS:**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
Download from: https://aws.amazon.com/cli/

### 6.2 Verify Installation
```bash
aws --version
# Should show: aws-cli/2.x.x
```

### 6.3 Configure AWS CLI
```bash
aws configure
```

Enter when prompted:
- AWS Access Key ID: `AKIA...` (from Step 4)
- AWS Secret Access Key: `wJalrXUtn...` (from Step 4)
- Default region name: `us-east-1`
- Default output format: `json`

### 6.4 Test Connection
```bash
# List secrets (should be empty)
aws secretsmanager list-secrets

# Should return: { "SecretList": [] }
```

✅ **AWS CLI Configured!**

---

## Step 7: Set Up Billing Alerts (Avoid Surprise Charges) - 5 minutes

### 7.1 Enable Billing Alerts
1. Click account name (top right) → **"Billing and Cost Management"**
2. Left sidebar → **"Billing preferences"**
3. Check ✓ **"Receive Free Tier Usage Alerts"**
4. Enter email: your email
5. Check ✓ **"Receive Billing Alerts"**
6. Click **"Save preferences"**

### 7.2 Create Budget Alert
1. Left sidebar → **"Budgets"**
2. Click **"Create budget"**
3. Select **"Customize (advanced)"**
4. Budget type: **"Cost budget"**
5. Click **"Next"**
6. Budget name: `limn-monthly-budget`
7. Budgeted amount: `$10` (adjust as needed)
8. Click **"Next"**
9. Alert threshold: `80%` of budgeted amount
10. Email recipients: your email
11. Click **"Next"** → **"Create budget"**

✅ **Billing Alerts Active!** You'll be notified if costs exceed $8/month.

---

## Step 8: Understand AWS Costs

### Secrets Manager Pricing (as of 2025):
```
$0.40 per secret per month
$0.05 per 10,000 API calls

Free Tier (first 30 days):
- 30 days free trial for new secrets
- After trial: standard pricing applies
```

### Example Monthly Cost:
```
5 API secrets × $0.40 = $2.00/month
50,000 API calls × $0.05/10k = $0.25/month
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ~$2.25/month
```

### Cost Optimization Tips:
1. **Cache secrets in memory** (don't fetch on every request)
2. **Combine secrets** (store multiple keys in one secret)
3. **Use local storage for dev** (only AWS for production)
4. **Delete unused secrets** (clean up regularly)

---

## Step 9: Add AWS Credentials to Your Project

### 9.1 Update .env File
Add these lines to `/Users/eko3/limn-systems-enterprise/.env`:

```bash
# AWS Secrets Manager Configuration
AWS_ACCESS_KEY_ID=AKIA...              # From Step 4
AWS_SECRET_ACCESS_KEY=wJalrXUtn...     # From Step 4
AWS_REGION=us-east-1                    # Your chosen region
AWS_SECRETS_ENABLED=true                # Feature flag
```

### 9.2 Install AWS SDK
I'll do this for you automatically, but here's what will be installed:
```bash
npm install @aws-sdk/client-secrets-manager
```

---

## Step 10: Security Best Practices

### ✅ Do's:
1. ✓ **Enable MFA** on root and IAM accounts
2. ✓ **Never commit** AWS keys to git (.env is in .gitignore)
3. ✓ **Rotate access keys** every 90 days
4. ✓ **Use IAM user**, never root account for daily tasks
5. ✓ **Set up billing alerts** to avoid surprise charges
6. ✓ **Use least privilege** (only grant needed permissions)

### ❌ Don'ts:
1. ✗ Don't share AWS root password
2. ✗ Don't commit .env files to git
3. ✗ Don't use root account for app access
4. ✗ Don't hardcode AWS keys in code
5. ✗ Don't ignore billing alerts
6. ✗ Don't grant full admin access to app

---

## Quick Reference Card

### AWS Console Login:
- **Root account:** https://console.aws.amazon.com (use rarely)
- **IAM user:** https://YOUR-ACCOUNT-ID.signin.aws.amazon.com/console
- **Region:** us-east-1 (N. Virginia)

### IAM User Details:
- **Username:** `limn-admin`
- **Access Key ID:** `AKIA...` (in .env file)
- **Secret Access Key:** `wJalrXUtn...` (in .env file)

### Secrets Manager:
- **Service:** AWS Secrets Manager
- **Region:** us-east-1
- **Pricing:** $0.40/secret/month + $0.05/10k API calls

### Support:
- **Free tier:** Included with account
- **AWS Documentation:** https://docs.aws.amazon.com/secretsmanager/
- **Billing dashboard:** https://console.aws.amazon.com/billing/

---

## Next Steps

Once AWS is set up, I'll build:
1. ✓ AWS Secrets Manager integration library
2. ✓ Updated tRPC endpoints
3. ✓ Enhanced UI with AWS features
4. ✓ Migration tool for existing credentials
5. ✓ Testing and documentation

**You're ready to proceed!** Let me know when you've completed the AWS setup.

---

## Troubleshooting

### Can't log in to AWS Console?
- **Check email:** Verify email used for signup
- **Reset password:** Use "Forgot password?" link
- **MFA issues:** Ensure authenticator app time is synced

### Access Keys not working?
```bash
# Test with AWS CLI
aws sts get-caller-identity

# Should show your IAM user ARN
# If error: check keys in .env match AWS
```

### Billing concerns?
- Check: https://console.aws.amazon.com/billing/
- Free tier usage: https://console.aws.amazon.com/billing/home#/freetier
- Delete unused secrets to reduce costs

### Need help?
- AWS Support (free tier): https://console.aws.amazon.com/support/
- AWS Documentation: https://docs.aws.amazon.com/
- Or contact me for assistance!
