# Deployment Guide

## Android Deployment (FREE)

### One-Time Setup

1. **Create Expo Account**
   - Go to https://expo.dev and sign up (free)
   - Verify your email

2. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

3. **Login to Expo**
   ```bash
   eas login
   ```

4. **Configure Project (First Time Only)**
   ```bash
   cd mobile
   eas build:configure
   ```

### Building Your APK

#### Option 1: Command Line (Recommended)
```bash
cd mobile
eas build --platform android --profile production
```

This will:
- Upload your code to Expo's build servers
- Build the APK in the cloud (takes 5-15 minutes)
- Provide a download link when complete

#### Option 2: GitHub Actions (Automated)
1. Get your Expo access token:
   ```bash
   eas whoami
   # Then go to https://expo.dev/accounts/[your-username]/settings/access-tokens
   # Create a new token
   ```

2. Add the token to GitHub:
   - Go to your repo Settings → Secrets and variables → Actions
   - Create a new secret named `EXPO_TOKEN`
   - Paste your Expo access token

3. Trigger the build:
   - Go to Actions tab in GitHub
   - Select "Build Android APK" workflow
   - Click "Run workflow"
   - Wait for the build to complete on expo.dev

### Publishing the Release

1. **Download the APK**
   - EAS will provide a download link
   - Or visit https://expo.dev/accounts/[your-username]/projects/date-planner/builds

2. **Create GitHub Release**
   - Go to your GitHub repo
   - Click "Releases" → "Create a new release"
   - Tag: `v1.0.0` (or your version number)
   - Title: `Date Planner v1.0.0`
   - Upload the APK file
   - Click "Publish release"

3. **Share with Users**
   - Users can download the APK from your GitHub releases page
   - Installation requires enabling "Install from Unknown Sources" on Android

### Updating the App

1. Update version in `mobile/app.json`:
   ```json
   "version": "1.1.0"
   ```

2. Build new APK:
   ```bash
   cd mobile
   eas build --platform android --profile production
   ```

3. Create new GitHub release with the updated APK

## iOS Deployment (REQUIRES $99/YEAR)

**Not possible without an Apple Developer account.**

If you get an Apple Developer account in the future:
```bash
cd mobile
eas build --platform ios --profile production
eas submit --platform ios
```

## Troubleshooting

### Build Fails
- Check the build logs on https://expo.dev
- Ensure all dependencies are installed
- Make sure app.json is valid

### APK Won't Install
- User needs to enable "Install from Unknown Sources"
- Settings → Security → Unknown Sources (varies by Android version)

### Backend Connection Issues
- Verify the API URL in `mobile/app.json` under `extra.apiUrl`
- Ensure your backend is deployed and accessible

## Free Resources Used

- **Expo EAS Build**: Free tier includes builds (limited per month)
- **GitHub**: Free hosting and releases
- **Railway/Render**: Free backend hosting options

No credit card required for any of the above!
