# Expo Prebuild Configuration Preservation

## Problem
When running `npx expo prebuild`, custom Android configurations were being deleted from:
- `android/app/build.gradle` (ABI splits configuration)
- `android/app/proguard-rules.pro` (ProGuard rules)
- `android/gradle.properties` (custom Gradle properties)

This caused build failures in GitHub Actions.

## Solution
Created a config plugin `withCustomAndroidConfig.js` that preserves all custom configurations during prebuild.

### What It Preserves

#### 1. **ABI Splits Configuration** (build.gradle)
```gradle
splits {
  abi {
    enable true
    reset()
    include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
    universalApk true
  }
}
```

#### 2. **Gradle Properties** (gradle.properties)
- Memory settings for CI builds
- PNG crunching
- React Native architectures
- Image format support (GIF, WebP)
- Network inspector
- Legacy packaging settings

#### 3. **ProGuard Rules** (proguard-rules.pro)
- React Native Core rules
- Hermes engine rules
- React Native Reanimated rules
- Expo Modules rules
- OkHttp rules
- Fresco (image loading) rules
- JSC (JavaScriptCore) rules
- Kotlin rules
- Camera and Vision rules
- General Android rules

## Usage

The plugin is automatically applied in `app.json`:

```json
{
  "expo": {
    "plugins": [
      "./plugins/withCustomAndroidConfig",
      // ... other plugins
    ]
  }
}
```

## How It Works

The plugin uses Expo's config plugin system to:

1. **withAppBuildGradle**: Injects ABI splits configuration into build.gradle
2. **withGradleProperties**: Ensures critical Gradle properties are set
3. **withProguardRules**: Appends comprehensive ProGuard rules

These modifications are applied **after** prebuild generates the native files, ensuring your customizations persist.

## Testing

After adding the plugin, test it:

```bash
# Clean and prebuild
npx expo prebuild --clean

# Verify configurations are still present
cat android/app/build.gradle | grep -A5 "splits {"
cat android/gradle.properties | grep "org.gradle.jvmargs"
cat android/app/proguard-rules.pro | grep "React Native Core"
```

All custom configurations should be present after prebuild.

## Important Notes

1. **Always commit after prebuild**: The plugin ensures consistency, but always commit the generated files
2. **CI/CD Compatibility**: This fixes GitHub Actions build errors by maintaining required configurations
3. **SDK Version**: Currently configured for Android 16 (API 36)
4. **No Manual Edits Needed**: The plugin handles everything automatically

## Troubleshooting

If configurations are still missing after prebuild:

1. Ensure the plugin is listed in `app.json` plugins array
2. Run prebuild with clean flag: `npx expo prebuild --clean`
3. Check plugin execution: Look for "withCustomAndroidConfig" in prebuild logs
4. Verify Node modules: `rm -rf node_modules && bun install`

## Related Files

- **Plugin**: `/plugins/withCustomAndroidConfig.js`
- **Configuration**: `/app.json`
- **Generated Files**:
  - `/android/app/build.gradle`
  - `/android/app/proguard-rules.pro`
  - `/android/gradle.properties`
