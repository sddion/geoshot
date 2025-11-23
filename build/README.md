# GeoShot Build Guide

Complete guide for building and signing Android APKs for the GeoShot application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Keystore Generation](#keystore-generation)
3. [Building APKs](#building-apks)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- **Java JDK 17** or higher
- **Android SDK Build Tools**
- **bundletool** (included in `tools/bundletool.jar`)
- **Node.js 20+** and npm/bun
- **Expo CLI** (`npm install -g expo-cli`)

### Verify Installation

```bash
java -version
node -version
npx expo-cli --version
```

---

## Keystore Generation

### Step 1: Generate a New Keystore

Use `keytool` to create a new keystore file:

```bash
keytool -genkeypair \
  -v \
  -storetype JKS \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_KEYSTORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -alias geoshot \
  -keystore tools/geoshot.keystore \
  -dname "CN=YourName, OU=Development, O=YourOrg, L=City, S=State, C=US"
```

**Parameters Explained:**
- `-storetype JKS`: Java KeyStore format
- `-keyalg RSA`: RSA encryption algorithm
- `-keysize 2048`: 2048-bit key size
- `-validity 10000`: Valid for ~27 years
- `-storepass`: Password for the keystore file
- `-keypass`: Password for the key alias
- `-alias geoshot`: Alias name for this key
- `-dname`: Distinguished name (replace with your info)

### Step 2: Verify Keystore

```bash
keytool -list -v -keystore tools/geoshot.keystore -storepass YOUR_KEYSTORE_PASSWORD
```

### Step 3: Configure Gradle Properties

Add to `android/gradle.properties` (DO NOT commit this file):

```properties
MYAPP_UPLOAD_STORE_FILE=../../tools/geoshot.keystore
MYAPP_UPLOAD_STORE_PASSWORD=YOUR_KEYSTORE_PASSWORD
MYAPP_UPLOAD_KEY_ALIAS=geoshot
MYAPP_UPLOAD_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

### Step 4: Save Certificate Fingerprints

Extract and save your certificate details for future verification:

```bash
keytool -list -v -keystore tools/geoshot.keystore -storepass YOUR_KEYSTORE_PASSWORD | grep -A 3 "SHA"
```

**⚠️ IMPORTANT:** Save these SHA fingerprints securely. You'll need them for:
- Google Play Console
- Firebase
- Google Maps API
- OAuth configurations

---

## Building APKs

### Option 1: Build with Gradle (Recommended)

**Build Architecture-Specific APKs:**

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/`
- `app-armeabi-v7a-release.apk`
- `app-arm64-v8a-release.apk`
- `app-x86-release.apk`
- `app-x86_64-release.apk`

**Build Specific Architecture:**

```bash
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

### Option 2: Build from AAB (Universal APK)

**Step 1: Build AAB**

```bash
cd android
./gradlew bundleRelease
```

**Step 2: Extract and Sign Universal APK**

```bash
java -jar tools/bundletool.jar build-apks \
  --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=builds/geoshot.apks \
  --mode=universal \
  --ks=tools/geoshot.keystore \
  --ks-pass=pass:YOUR_KEYSTORE_PASSWORD \
  --ks-key-alias=geoshot \
  --key-pass=pass:YOUR_KEY_PASSWORD
```

**Step 3: Extract the APK**

```bash
unzip builds/geoshot.apks universal.apk -d builds/
mv builds/universal.apk builds/geoshot-universal-signed.apk
```

### Option 3: GitHub Actions (Automated)

The project includes a GitHub Actions workflow that automatically builds all architectures:

```bash
# Push a tag to trigger release build
git tag v2.0.0
git push origin v2.0.0

# Or manually trigger via GitHub Actions UI
# Actions → Build and Release Android → Run workflow
```

---

## Verification

### Verify APK Signature

**Using apksigner:**

```bash
apksigner verify --print-certs builds/geoshot-universal-signed.apk
```

**Using keytool:**

```bash
keytool -printcert -jarfile builds/geoshot-universal-signed.apk
```

### Extract Certificate Info

```bash
keytool -printcert -jarfile builds/geoshot-universal-signed.apk > builds/cert_info.txt
```

### Test APK Installation

```bash
adb install builds/geoshot-universal-signed.apk
```

---

## Certificate Details (Example)

The GeoShot APK should be signed with a certificate containing:

```
Subject: CN=sddion, OU=Development Team, O=sddion
SHA-256: 05c8419f944d673c0ac063fd4da6581b8474e32fdf06043462e703d2411cc5c2
SHA-1: 274cf0bd8082138229470ee76d6981b974649993
MD5: 903748ff1a76d825b2db9428b671bca1
```

---

## Troubleshooting

### "File already exists" Error

```bash
rm builds/geoshot.apks
```

### "Not a signed jar file"

Use `apksigner` instead of `keytool`:

```bash
apksigner verify --print-certs your-app.apk
```

### Keystore Password Lost

**⚠️ There is NO way to recover a lost keystore password.** If you lose it:
1. Generate a new keystore
2. Users must uninstall the old app before installing the new one
3. You'll lose the ability to update the existing app on Google Play

**Prevention:** Store keystore credentials in a secure password manager.

### Build Fails with "Keystore not found"

Ensure the path in `gradle.properties` is correct:

```properties
MYAPP_UPLOAD_STORE_FILE=../../tools/geoshot.keystore
```

The path is relative to `android/app/`.

### SDK Version Errors

Update `android/gradle.properties`:

```properties
android.minSdkVersion=26
```

---

## Security Best Practices

### ✅ DO:
- Store keystore in a secure location (NOT in version control)
- Use strong passwords (20+ characters, mixed case, numbers, symbols)
- Keep multiple backups of your keystore in different secure locations
- Use environment variables or secrets management for CI/CD
- Rotate keys if compromised

### ❌ DON'T:
- Commit keystore files to Git
- Share keystore passwords in plain text
- Use weak passwords
- Store keystore in cloud storage without encryption
- Use the same keystore for multiple apps

---

## File Structure

```
build/
├── README.md              # This file
├── sources/               # Source AAB files
│   └── app-release.aab
├── builds/                # Built APKs
│   ├── geoshot-universal-signed.apk
│   └── cert_info.txt      # Certificate details
└── tools/                 # Build tools
    ├── bundletool.jar
    └── geoshot.keystore   # ⚠️ DO NOT COMMIT
```

---

## Quick Reference

**Generate Keystore:**
```bash
keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 \
  -alias geoshot -keystore tools/geoshot.keystore
```

**Build APK:**
```bash
cd android && ./gradlew assembleRelease
```

**Verify APK:**
```bash
apksigner verify --print-certs app-release.apk
```

**Install APK:**
```bash
adb install app-release.apk
```

---

## Additional Resources

- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [Bundletool Documentation](https://developer.android.com/studio/command-line/bundletool)
- [Expo Build Documentation](https://docs.expo.dev/build/setup/)
- [GitHub Actions for Android](https://github.com/actions/setup-java)