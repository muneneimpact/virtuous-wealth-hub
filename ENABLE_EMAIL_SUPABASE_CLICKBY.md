# Step-by-Step: Enable Email Auth in Supabase (With Screenshots Guide)

## The Problem

Your app has the email/password UI built, but **Supabase doesn't know how to handle it yet**.

When you try to sign up with email, you get an error because the Email provider is disabled.

## The Solution (3 clicks in Supabase)

### Step 1: Login to Supabase

Go to: https://app.supabase.com/auth/users

You'll see your projects list.

### Step 2: Select Your Project

Find and click: **virtuous-wealth-hub**

### Step 3: Go to Authentication

In the left sidebar, click: **Authentication**

You should see:
```
Authentication
├─ Users
├─ Providers      ← Click this
├─ Policies
├─ Email Templates
└─ URL Configuration
```

### Step 4: Click "Providers"

You'll see a list of authentication methods:
```
Enabled:
├─ Google       (already enabled)
└─ ... others

Disabled:
├─ Email        ← This one
├─ Phone
├─ Supabase     ← This one too
└─ ... others
```

### Step 5: Click "Email"

Find the **Email** option in the disabled list.

Click on it or click the **Enable** button next to it.

### Step 6: Click the Toggle

You'll see a screen with settings. Look for:
```
[ ] Enable Email   ← Toggle switch
```

**Click the toggle to turn it ON** (it turns green)

The page should show more options now like:
- Email confirmations: [✓] Enabled
- Confirm email: [✓] Verified
- etc.

### Step 7: Save

Click the **Save** button at the bottom.

You'll see a success message:
```
✓ Updated authentication settings
```

## Done!

That's it! Email authentication is now enabled.

## Testing It

1. Go to: http://localhost:8080
2. Click the **Sign Up** tab
3. Fill in the form:
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Password: `SecurePassword123`
   - Confirm: `SecurePassword123`
4. Click **Create Account**

**Expected Result**:
```
✓ Success
Account created. Please check your email to confirm, then sign in.
```

If you see this, check your email for a confirmation link.

## If It Still Doesn't Work

### Check 1: Is Email Actually Enabled?

Go back to **Authentication** → **Providers** → **Email**

Verify the toggle is GREEN (enabled).

### Check 2: Check for Errors

1. Open browser DevTools: Press **F12**
2. Click **Console** tab
3. Try signing up again
4. Look for error messages in red

Common errors:
- "Email provider is not enabled" → Go back to step 6
- "Invalid email format" → Use a valid email
- "Password must be at least 6 characters" → Use longer password

### Check 3: Check Supabase Logs

1. Go to: **Logs** (left sidebar)
2. Filter for your email signup attempt
3. Look for error details

### Check 4: Check Your Email Spam Folder

After signing up, check:
- Inbox
- Spam folder
- Junk folder

The confirmation email might be there.

## Video Summary

If you get stuck:

1. Log in to https://app.supabase.com
2. Go to your project: **virtuous-wealth-hub**
3. Left sidebar: **Authentication**
4. Click: **Providers**
5. Find: **Email**
6. Click: **Enable**
7. Click the toggle switch (turns green)
8. Click: **Save**

**Total time: 2 minutes**

## Configuration Details (Optional)

### Default Email Settings

When you enable Email provider, it automatically uses:
- **Email from**: noreply@supabase.com (default)
- **Confirmation link**: Automatically generated
- **Email template**: Default Supabase template

### To Customize (Optional)

1. Go to: **Authentication** → **Email Templates**
2. Click: **Confirmation**
3. Edit the email text, subject, or styling
4. Save changes

### For Production Custom Domain (Optional)

1. Go to: **Authentication** → **SMTP Settings**
2. Configure your email provider (SendGrid, AWS SES, etc.)
3. Now emails come from your domain instead of Supabase

## Common Questions

**Q: Do I need to set up email templates?**
A: No, the default template works fine. You can customize later.

**Q: Do I need SMTP setup?**
A: No, Supabase sends emails by default. SMTP is optional for custom domains.

**Q: Can users sign up without confirming email?**
A: No, they must confirm via the email link first (this is the secure default).

**Q: How long does the email take to arrive?**
A: Usually 1-2 minutes. Check spam folder if it's longer.

**Q: Can I change the confirmation link URL?**
A: Yes, in **Authentication** → **URL Configuration**, add your domain URLs.

## What Happens After Enabling

Once Email is enabled:

1. Users can **Sign Up** with email + password
2. Supabase sends a **confirmation email**
3. User clicks the **confirmation link**
4. User is now **confirmed** and can **sign in**
5. New users have **status = "pending"** (admin must approve)
6. Admin approves in the **Members** section
7. User can access the **dashboard**

## Visual Flow

```
User visits app
    ↓
Clicks "Sign Up"
    ↓
Fills email, password, name
    ↓
Clicks "Create Account"
    ↓
Supabase creates account + sends email
    ↓
User clicks link in email
    ↓
Account confirmed
    ↓
User returns to app
    ↓
Clicks "Sign In"
    ↓
Enters email + password
    ↓
Redirected to dashboard (pending approval)
    ↓
Admin approves
    ↓
User can access full dashboard
```

## Quick Checklist

- [ ] Logged into Supabase dashboard
- [ ] Selected virtuous-wealth-hub project
- [ ] Went to Authentication → Providers
- [ ] Clicked Email
- [ ] Toggled Enable (turned green)
- [ ] Clicked Save
- [ ] Tested signup at http://localhost:8080
- [ ] Received confirmation email
- [ ] Signed in with email + password

**You're done!** 🎉

---

**Date**: March 18, 2026
**Status**: Ready for you to enable
**Time Required**: 2 minutes
