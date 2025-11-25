const { withAppBuildGradle } = require('@expo/config-plugins');

function withAndroidSigning(config) {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = addSigningConfig(config.modResults.contents);
        } else {
            throw new Error('Cannot add signing config to build.gradle because it is not groovy');
        }
        return config;
    });
}

function addSigningConfig(buildGradle) {
    // Complete signingConfigs block with debug and release
    const signingConfigsBlock = `signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            } else {
                // Fallback to debug keystore if no upload keystore is configured
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
            }
        }
    }`;

    // Complete buildTypes block with proper signing references
    const buildTypesBlock = `buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release
            def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'
            shrinkResources enableShrinkResources.toBoolean()
            minifyEnabled enableMinifyInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
            def enablePngCrunchInRelease = findProperty('android.enablePngCrunchInReleaseBuilds') ?: 'true'
            crunchPngs enablePngCrunchInRelease.toBoolean()
        }
    }`;

    // If custom signing already exists, don't modify
    if (buildGradle.includes('MYAPP_UPLOAD_STORE_FILE') && buildGradle.includes('signingConfigs {')) {
        return buildGradle;
    }

    // Replace the signingConfigs block (Expo generates a basic one)
    // Use flexible regex that handles nested braces
    const originalLengthSigning = buildGradle.length;
    buildGradle = buildGradle.replace(
        /signingConfigs\s*\{(?:[^{}]|\{[^{}]*\})*\}/s,
        signingConfigsBlock
    );

    if (buildGradle.length === originalLengthSigning) {
        console.warn('[withAndroidSigning] Warning: signingConfigs block replacement may have failed');
    }

    // Replace the buildTypes block with flexible indentation matching
    const originalLengthBuild = buildGradle.length;
    buildGradle = buildGradle.replace(
        /buildTypes\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/s,
        buildTypesBlock
    );

    if (buildGradle.length === originalLengthBuild) {
        console.warn('[withAndroidSigning] Warning: buildTypes block replacement may have failed');
    }

    return buildGradle;
}

module.exports = withAndroidSigning;
