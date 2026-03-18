# Supabase Email/Password Authentication Setup

## Overview
The Virtuous Deca Investment application now supports two authentication methods:
1. **Google OAuth** (Already configured)
2. **Email/Password** (Newly added)

## Email/Password Setup Steps

### Step 1: Enable Email Provider in Supabase

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **virtuous-wealth-hub**
3. Go to **Authentication** → **Providers**
4. Find **Email** in the list
5. Click **Enable** (toggle switch)
6. Configure settings:
   - **Email confirmations**: Enable
   - **Confirm email**: Check both boxes
   - **Enable rate limiting**: Optional (recommended for production)

### Step 2: Verify Email Template

In **Authentication** → **Email Templates**:
- **Confirmation**: Edit and verify the email template is correct
- Ensure the confirmation link points to your domain

### Step 3: Configure Redirect URLs

In **Authentication** → **URL Configuration**:

Add redirect URLs for both development and production:

**Development**:
- `http://localhost:8080`
- `http://localhost:8080/dashboard`
- `http://localhost:8080/admin`
- `http://localhost:8080/treasurer`
- `http://localhost:8080/pending-approval`

**Production**:
- `https://yourdomain.com`
- `https://yourdomain.com/dashboard`
- `https://yourdomain.com/admin`
- `https://yourdomain.com/treasurer`
- `https://yourdomain.com/pending-approval`

### Step 4: Email Configuration (Optional - For Custom Domain)

If you want to send emails from a custom domain:

1. Go to **Email** → **SMTP Settings**
2. Configure SMTP provider (SendGrid, AWS SES, etc.)
3. Or use Supabase's default email service

## Testing Email Authentication Locally

### 1. Sign Up with Email

1. Navigate to `http://localhost:8080`
2. Click the **Sign Up** tab
3. Fill in:
   - Full Name: `John Doe`
   - Email: `test@example.com`
   - Password: `SecurePassword123`
   - Confirm Password: `SecurePassword123`
4. Click **Create Account**

**Expected Behavior**:
- Success toast notification appears
- Confirmation email sent to inbox
- New user created with "pending" status in `profiles` table

### 2. Confirm Email

1. Check your email inbox (may be in spam folder)
2. Click the confirmation link
3. You should be redirected back to the app
4. Status in `profiles` table updates to "confirmed"

### 3. Sign In with Email

1. Go back to login page
2. Click **Sign In** tab
3. Enter email and password
4. Click **Sign In with Email**

**Expected Behavior**:
- User is authenticated
- Redirected to dashboard (if approved) or pending approval page

## Troubleshooting

### Problem: Sign Up Form Not Showing

**Solution**: Ensure the Login page component updated successfully
```bash
# Verify the file contains the Tabs component
grep -n "TabsContent value=\"signup\"" src/pages/Login.tsx
```

### Problem: Email Not Sent

**Possible Causes**:
1. Email provider not enabled in Supabase
2. SMTP settings not configured
3. Email rate limiting triggered
4. Email in spam folder

**Solution**:
1. Check Supabase **Authentication** → **Email** settings
2. Verify SMTP provider configuration
3. Check Supabase logs for errors
4. Whitelist confirmation emails in email client

### Problem: Confirmation Link Not Working

**Solution**:
1. Verify redirect URLs configured in Supabase
2. Check email template has correct URL
3. Ensure email template uses `{{ .ConfirmationURL }}`

### Problem: "Invalid email or password" on Sign In

**Possible Causes**:
1. User hasn't confirmed email yet
2. Password doesn't match
3. User doesn't exist in database

**Solution**:
1. Have user check spam folder for confirmation email
2. Verify correct password
3. Check `profiles` table for user record

### Problem: Profile Not Created After Sign Up

**Solution**: Manually create profile entry
```sql
INSERT INTO profiles (user_id, display_name, email, status)
VALUES ('user-id-here', 'Display Name', 'email@example.com', 'pending');
```

## Email Authentication Flow

```
User Sign Up
     ↓
Create Auth User (Supabase)
     ↓
Send Confirmation Email
     ↓
Create Profile (status = 'pending')
     ↓
User Clicks Email Link
     ↓
Email Confirmed
     ↓
Admin Approves User
     ↓
Status = 'confirmed'
     ↓
User Can Sign In & Access Dashboard
```

## Production Deployment

### Before Going Live

1. **Configure Custom Email Domain** (optional):
   - Set up SMTP provider (SendGrid, AWS SES)
   - Configure in Supabase Email settings

2. **Update Redirect URLs** to production domain

3. **Enable Rate Limiting**:
   - Prevent signup/sign-in abuse
   - Set limits: 10 requests per minute

4. **Configure Email Templates**:
   - Test confirmation emails work
   - Customize branding if needed

5. **Set Password Requirements**:
   - Minimum length: 6 characters (currently)
   - Consider increasing to 8 or 12 for security

### Security Best Practices

1. **HTTPS Only**: Ensure all redirect URLs use https://
2. **Rate Limiting**: Enable to prevent brute force attacks
3. **Password Requirements**: Enforce strong passwords
4. **Email Verification**: Require email confirmation before login
5. **Session Management**: Configure session timeout (default 1 hour)

## Code Changes Made

### File: `src/pages/Login.tsx`

Added:
- **handleEmailSignIn()** - Email/password sign in
- **handleEmailSignUp()** - Email/password registration
- **Tabs component** - Switch between Sign In and Sign Up
- **Form validation** - Checks email, password, matching
- **Loading states** - Spinner during auth operations

## Configuration Reference

### Supabase Auth Settings
```typescript
// src/integrations/supabase/client.ts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### Environment Variables
```env
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Support & Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Authentication Guide](https://supabase.com/docs/guides/auth/auth-email)
- [JavaScript Auth Reference](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**Status**: ✅ Code Implemented
**Next Step**: Enable Email provider in Supabase Dashboard
**Date Updated**: March 18, 2026
