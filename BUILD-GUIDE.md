
## Prerequisites

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure Your Project
```bash
eas build:configure
```

This creates `eas.json` in your project root.

---

## Step 1: Create/Update eas.json

Create or update `eas.json` with production build configuration:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      },
      "ios": {
        "bundler": "metro"
      }
    },
    "production-apk": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Step 2: Update app.json for Production

Ensure these settings are in your `app.json`:

```json
{
  "expo": {
    "name": "GeoShot Camera",
    "slug": "geoshot-camera",
    "version": "1.0.1",
    "jsEngine": "hermes",
    "android": {
      "package": "app.geoshot.camera",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO"
      ]
    }
  }
}
```

**Important Version Fields:**
- `version`: User-facing version (e.g., "1.0.1")
- `versionCode`: Integer that increases with each release (e.g., 1, 2, 3...)

---

## Step 3: Build Production APK/AAB

### Option A: App Bundle (AAB) - Recommended for Play Store
```bash
eas build --platform android --profile production
```

**Advantages:**
- Smallest download size (30-50 MB)
- Google Play optimizes per-device
- Required for Play Store
- Dynamic delivery support

### Option B: APK - For Direct Distribution
```bash
eas build --platform android --profile production-apk
```

**Advantages:**
- Can install directly (40-80 MB)
- No Play Store needed
- Good for testing

### Option C: Preview APK - Quick Testing
```bash
eas build --platform android --profile preview
```

**Advantages:**
- Fast build
- Good for quick testing
- Smaller than development

---

## Step 4: Monitor Build Progress

After running the build command:

1. **Watch in Terminal:**
   ```
   ✔ Build ID: abc123-def456-ghi789
   🔗 https://expo.dev/accounts/yourname/projects/geoshot-camera/builds/abc123
   ```

2. **Check EAS Dashboard:**
   - Visit the URL shown in terminal
   - Watch build logs in real-time
   - Download APK/AAB when complete

3. **Build Time:** Typically 10-20 minutes

---

## Step 5: Download and Test

### Download APK
```bash
# Download directly
eas build:download --platform android --profile production-apk

# Or use the dashboard link
```

### Install on Device
```bash
# Via ADB
adb install your-app.apk

# Or transfer file and install manually
```

### Test Checklist
- [ ] Camera functionality works
- [ ] GPS overlay displays correctly
- [ ] Video recording saves with GPS data
- [ ] Permissions requested properly
- [ ] App size is reasonable (check with: `ls -lh your-app.apk`)
- [ ] No crashes or errors

---

## Step 6: Submit to Google Play Store

### A. Generate Upload Key (First Time Only)
```bash
# EAS will handle this automatically
eas credentials
```

### B. Build AAB for Play Store
```bash
eas build --platform android --profile production
```

### C. Submit to Play Store
```bash
eas submit --platform android
```

Or manually:
1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Upload AAB file
4. Fill in store listing
5. Submit for review

---

## Expected File Sizes

### Development Build
- **Size:** ~200-300 MB
- **Reason:** Includes dev tools, debug symbols, unoptimized

### Production APK
- **Size:** ~40-80 MB
- **Optimization:** Minified, ProGuard, tree-shaking

### Production AAB (Play Store)
- **Size:** ~30-50 MB
- **On Device:** ~25-40 MB (Google Play optimizes)
- **Why Smaller:** Per-device optimization, split APKs

---

## Size Optimization Tips

### Already Applied ✓
- [x] Hermes engine enabled
- [x] Unused dependencies removed
- [x] Images optimized

### Additional Optimizations

#### 1. Enable ProGuard/R8 (Android)
Add to `android/app/build.gradle`:
```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 2. Enable App Bundle Optimization
In `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

#### 3. Use WebP Images (Future)
Convert PNG to WebP for 25-35% size reduction:
```bash
# Convert icons
cwebp icon.png -o icon.webp -q 85
```

---

## Common Issues & Solutions

### Issue: Build Fails
**Solution:**
```bash
# Clear EAS cache
eas build --clear-cache --platform android --profile production

# Check build logs for specific errors
```

### Issue: APK Too Large
**Check:**
1. Is it production build? (not development)
2. Are unused dependencies removed?
3. Is Hermes enabled?
4. Are images optimized?

### Issue: App Crashes After Install
**Debug:**
```bash
# View device logs
adb logcat | grep -i "geoshot"

# Check for missing permissions or native module issues
```

---

## Quick Reference Commands

```bash
# Development build (for testing)
eas build --platform android --profile development

# Preview APK (quick test)
eas build --platform android --profile preview

# Production APK (direct install)
eas build --platform android --profile production-apk

# Production AAB (Play Store)
eas build --platform android --profile production

# Download latest build
eas build:download --platform android

# Submit to Play Store
eas submit --platform android

# View build status
eas build:list

# View credentials
eas credentials
```

---

## Next Steps

1. **Create `eas.json`** with the configuration above
2. **Run production build:**
   ```bash
   eas build --platform android --profile production
   ```
3. **Download and test** the APK/AAB
4. **Verify size** - should be ~40-60 MB (not 218 MB)
5. **Submit to Play Store** when ready

---

## Expected Timeline

| Step | Duration |
|------|----------|
| Configure eas.json | 5 minutes |
| Run build command | 1 minute |
| EAS build process | 15-20 minutes |
| Download & test | 10 minutes |
| Play Store submission | 30 minutes |
| **Total** | **~1 hour** |

**Review Time:** Google Play review typically takes 1-7 days.

---

## Summary

Your **development build is 218 MB** because it includes debugging tools and is not optimized.

A **production build** will be:
- **40-80 MB** for APK
- **30-50 MB** for AAB (Play Store)
- **25-40 MB** on user devices (after Play Store optimization)

This is **normal and expected** for a camera app with GPS features!
