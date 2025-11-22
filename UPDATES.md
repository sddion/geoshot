# GeoShot Updates Guide

This guide explains how to manage updates for GeoShot using Expo EAS and GitHub Releases.

## 🚀 Publishing an OTA Update

To push an Over-The-Air (OTA) update to users without going through the app store review process:

1.  **Commit your changes:**
    ```bash
    git add .
    git commit -m "fix: description of changes"
    ```
    *The pre-commit hook will ask if you want to bump the version. Answer 'y' if this is a release.*

2.  **Publish the update:**
    ```bash
    eas update --branch production --message "Version 1.0.x: Description of update"
    ```
    *This will upload the new JavaScript bundle to EAS servers.*

3.  **Create a GitHub Release (Important for new installs):**
    The app is configured to check for updates from GitHub Releases on first load.
    *   Go to [GitHub Releases](https://github.com/sddion/geoshot/releases).
    *   Draft a new release.
    *   Tag it with the version number (e.g., `v1.0.3`).
    *   **Crucial:** You must attach the `updates.json` or ensure the release structure matches what the app expects if you are hosting the update manifest manually on GitHub. 
    
    *Note: The current `eas.json` points to a static `updates.json` on GitHub. If you want EAS to manage the update manifest entirely, you might rely solely on `eas update`. However, if you are using the GitHub URL in `eas.json` as the update source, you need to ensure that URL returns a valid Expo update manifest.*

## 📦 Creating a Production Build

To create a new APK/AAB for the Play Store:

```bash
eas build --profile production --platform android
```

## 🔄 Version Management

The project uses a pre-commit hook to help you manage versions.
*   On every commit, you will be asked: `Do you want to bump the version? (y/N)`
*   If **Yes**: The patch version (e.g., 1.0.2 -> 1.0.3) will be incremented in both `package.json` and `app.json`.
*   If **No**: The version remains unchanged.

## 🛠 Troubleshooting

*   **Update not showing?**
    *   Check if the channel in `eas.json` matches the branch you published to.
    *   Restart the app twice to force a check and download.
