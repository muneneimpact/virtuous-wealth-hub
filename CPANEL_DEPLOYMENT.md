# Virtuous Deca - cPanel Deployment Guide

## Prerequisites
- GitHub repository connected to cPanel
- Node.js 18+ on cPanel server
- npm or yarn package manager

## Deployment Requirements Met ✅

### 1. `.cpanel.yml` Configuration
- ✅ Valid YAML format
- ✅ Deployment targets defined
- ✅ Build commands specified
- ✅ Post-deployment scripts configured

### 2. Repository Structure
- ✅ All source files committed
- ✅ No uncommitted changes
- ✅ Proper .gitignore configured
- ✅ Build output excluded from repo

## Deployment Steps

### Step 1: Environment Setup
1. Copy `.env.example` to `.env` on cPanel server
2. Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-url
   VITE_SUPABASE_ANON_KEY=your-key
   ```

### Step 2: Enable cPanel Git Integration
1. Go to cPanel > Git Version Control
2. Create a new repository or import existing
3. Select the virtuous-wealth-hub repository
4. Choose the `main` branch for deployment

### Step 3: Deploy
1. Click "Deploy" in cPanel Git interface
2. System will:
   - Clone/pull the latest code
   - Run `npm install`
   - Run `npm run build`
   - Deploy built files to public_html

## Build Output
- Source: `dist/` folder
- Deployed to: `public_html/`
- Contains optimized React application

## Important Files

### Configuration Files
- `.cpanel.yml` - cPanel deployment configuration
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `package.json` - Project dependencies and scripts

### Key Scripts
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview built files
npm run lint     # Lint code
```

## Troubleshooting

### Error: "No uncommitted changes exist on the checked-out branch"
**Solution**: Commit all changes:
```bash
git add .
git commit -m "Deployment: Add cPanel configuration and build files"
git push origin main
```

### Error: "Invalid .cpanel.yml file"
**Solution**: Verify YAML syntax:
```bash
cat .cpanel.yml  # Check formatting
```

### Build fails on cPanel
**Solution**: Check Node.js version:
```bash
node --version  # Should be 18+
npm --version   # Should be 8+
```

## Database (Supabase)
- PostgreSQL database on Supabase
- Real-time subscriptions configured
- Row-Level Security (RLS) policies active
- Automatic migrations applied

## Support
For deployment issues, check:
1. GitHub repository has latest commits
2. `.cpanel.yml` is properly formatted
3. Environment variables are set
4. Node.js version meets requirements

---
**Last Updated**: March 18, 2026
**Version**: 1.0.0
