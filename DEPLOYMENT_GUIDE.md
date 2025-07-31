# Deployment Guide for Blackjack Tournament App

## Option 1: Vercel (Recommended - Easiest)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - Say "yes" to set up a new project
   - Choose the defaults
   - Your app will be live in ~1 minute!

3. **Get your URL**: Vercel will give you a URL like `https://your-app.vercel.app`

## Option 2: Netlify

1. **Build the app** (already done):
   ```bash
   npm run build
   ```

2. **Go to [Netlify](https://app.netlify.com)**
   - Sign up/login
   - Drag and drop the `build` folder to the deployment area
   - Your app is instantly live!

3. **Custom domain** (optional):
   - Click "Domain settings"
   - Add your custom domain

## Option 3: GitHub Pages (If using GitHub)

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json**:
   ```json
   "homepage": "https://yourusername.github.io/blackjack-tournament",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

## Option 4: Surge.sh

1. **Install Surge**:
   ```bash
   npm install -g surge
   ```

2. **Deploy**:
   ```bash
   cd build
   surge
   ```
   - Choose a domain or use the suggested one
   - Your app is live!

## Environment Variables

For all deployment options, you'll need to set your environment variables:

- **Vercel**: Add in project settings or use `vercel env`
- **Netlify**: Add in Site settings > Environment variables
- **GitHub Pages**: Use GitHub Secrets (for Actions)
- **Surge**: Build with env vars before deploying

Example:
```
REACT_APP_SUPABASE_URL=https://uhompzerslownizwqwoq.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_key_here
```

## Post-Deployment Checklist

1. ✅ Test creating a tournament
2. ✅ Test uploading player CSV
3. ✅ Test player registration
4. ✅ Test seating assignments
5. ✅ Check all pages load correctly
6. ✅ Verify Supabase connection works

## Sharing Your App

Once deployed, share the URL with your users. They can access it from any device with internet!

## Security Notes

- The anon key in your .env is safe to expose (it's designed for browser use)
- Consider adding authentication if you want to restrict access
- Enable RLS (Row Level Security) in Supabase for production use