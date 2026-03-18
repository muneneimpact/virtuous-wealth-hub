# GitHub & cPanel Deployment Guide

## Fixing GitHub Push Error (403 Forbidden)

### Option 1: Using GitHub CLI (Recommended)
```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Push to GitHub
git push origin main
```

### Option 2: Using Personal Access Token
1. Go to GitHub > Settings > Developer settings > Personal access tokens
2. Generate a new token with `repo` scope
3. Use the token as password when prompted:

```bash
cd "/Users/pc/Desktop/Work\ Websites/virtuous-wealth-hub"
git push origin main
# When prompted for password, paste your personal access token
```

### Option 3: Using SSH Key
```bash
# Generate SSH key (if not already done)
ssh-keygen -t ed25519 -C "muneneimpact@gmail.com"

# Add to SSH agent
ssh-add ~/.ssh/id_ed25519

# Change remote to SSH
git remote set-url origin git@github.com:muneneimpact/virtuous-wealth-hub.git

# Push
git push origin main
```

---

## After Successful GitHub Push

### cPanel Deployment Steps

1. **Access cPanel**
   - Log in to your cPanel account
   - Look for "Git Version Control" or "Repository Manager"

2. **Create/Update Git Repository**
   - URL: `https://github.com/muneneimpact/virtuous-wealth-hub`
   - Branch: `main`
   - Deployment path: `/public_html`

3. **Configure Deployment**
   - The `.cpanel.yml` file will be automatically detected
   - Build steps will run: `npm install` then `npm run build`

4. **Deploy**
   - Click "Deploy" button
   - System will:
     - Clone latest code
     - Install dependencies
     - Build the application
     - Deploy to public_html

---

## Files Required for cPanel Deployment ✅

### ✓ .cpanel.yml
Deployment configuration file - **REQUIRED**
- Specifies build commands
- Defines deployment paths
- Sets post-deployment scripts

### ✓ CPANEL_DEPLOYMENT.md
Deployment guide documentation
- Prerequisites
- Build output information
- Troubleshooting

### ✓ deploy.sh
Bash build script for testing locally
- Verifies Node.js version
- Installs production dependencies
- Builds the application

### ✓ .env.example
Environment variables template
- Provides example configuration
- Documents required variables
- Guides setup process

### ✓ package.json
Project dependencies
- All npm packages listed
- Build and dev scripts defined
- Production dependencies included

---

## Environment Setup on cPanel

### Step 1: Create .env file
SSH into your cPanel server:
```bash
ssh user@yourdomain.com
cd public_html
nano .env
```

Add your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anonymous-key-here
```

### Step 2: Verify Build
```bash
npm run build
ls dist/  # Should show built files
```

---

## Monitoring Deployment

### Check Deployment Log
- cPanel > Git Version Control > View Deployment Log
- Look for "Build completed successfully"

### Test Application
- Visit `https://yourdomain.com`
- Test login and basic features
- Check browser console for errors

### If Deployment Fails
1. Check `.cpanel.yml` is valid YAML
2. Ensure `npm install` completes
3. Verify environment variables set
4. Check Node.js version: `node -v` (must be 18+)

---

## Current Git Status ✅

```
✓ Commits prepared and ready
✓ .cpanel.yml configuration added
✓ All files staged
✓ Ready to push to GitHub
✓ Ready for cPanel deployment
```

---

## Next Immediate Steps

1. **Push to GitHub**
   ```bash
   cd "/Users/pc/Desktop/Work\ Websites/virtuous-wealth-hub"
   git push origin main
   ```

2. **Verify on GitHub**
   - Go to `github.com/muneneimpact/virtuous-wealth-hub`
   - Confirm all files are visible
   - Check `.cpanel.yml` is present

3. **Deploy via cPanel**
   - Log into cPanel
   - Go to Git Version Control
   - Click Deploy
   - Wait for "Build completed successfully" message

4. **Test Deployment**
   - Visit your website
   - Verify all features working
   - Check mobile responsiveness

---

## Troubleshooting Commands

```bash
# Check git status
git status

# View recent commits
git log --oneline -n 5

# See what will be pushed
git diff origin/main

# Verify .cpanel.yml syntax
cat .cpanel.yml

# Test build locally
npm install
npm run build
du -sh dist/
```

---

**Created**: March 18, 2026  
**Status**: Ready for Production Deployment
