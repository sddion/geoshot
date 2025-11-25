const { withAppBuildGradle, withGradleProperties, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin to preserve custom Android build configurations during prebuild
 * This prevents important build customizations from being deleted
 */
const withCustomAndroidConfig = (config) => {
    // 1. Preserve ABI splits configuration in build.gradle
    config = withAppBuildGradle(config, (config) => {
        let contents = config.modResults.contents;

        // Add ABI splits configuration before androidResources block
        if (!contents.includes('splits {')) {
            const splitsConfig = `
    splits {
      abi {
        enable true
        reset()
        include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        universalApk true
      }
    }
  `;

            contents = contents.replace(
                /androidResources\s*{/,
                `${splitsConfig}\n  androidResources {`
            );
        }

        config.modResults.contents = contents;
        return config;
    });

    // 2. Preserve gradle.properties custom settings
    config = withGradleProperties(config, (config) => {
        const properties = config.modResults;

        // Ensure critical properties are set
        const criticalProps = {
            // Memory settings for CI
            'org.gradle.jvmargs': '-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8',
            'org.gradle.parallel': 'true',

            // Enable PNG crunching
            'android.enablePngCrunchInReleaseBuilds': 'true',

            // React Native architectures
            'reactNativeArchitectures': 'armeabi-v7a,arm64-v8a,x86,x86_64',

            // Image format support
            'expo.gif.enabled': 'true',
            'expo.webp.enabled': 'true',
            'expo.webp.animated': 'false',

            // Network inspector
            'EX_DEV_CLIENT_NETWORK_INSPECTOR': 'true',

            // Legacy packaging
            'expo.useLegacyPackaging': 'false',

            // Android SDK versions - prevent deletion during prebuild
            'android.compileSdkVersion': '35',
            'android.targetSdkVersion': '35',
            'android.buildToolsVersion': '35.0.0',
        };

        // Add or update properties
        Object.entries(criticalProps).forEach(([key, value]) => {
            const existingProp = properties.find(prop => prop.key === key);
            if (existingProp) {
                existingProp.value = value;
            } else {
                properties.push({ type: 'property', key, value });
            }
        });

        return config;
    });


    // 3. Preserve ProGuard rules
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            const proguardPath = path.join(
                config.modRequest.platformProjectRoot,
                'app',
                'proguard-rules.pro'
            );

            const customRules = `
# ===================================
# React Native Core
# ===================================
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip
-keep,allowobfuscation @interface com.facebook.jni.annotations.DoNotStrip

-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keep @com.facebook.jni.annotations.DoNotStrip class *

-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
    @com.facebook.jni.annotations.DoNotStrip *;
}

-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}

-keep class * implements com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * implements com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }

-dontwarn com.facebook.react.**
-keep,includedescriptorclasses class com.facebook.react.bridge.** { *; }
-keep,includedescriptorclasses class com.facebook.react.uimanager.** { *; }
-keep,includedescriptorclasses class com.facebook.react.modules.** { *; }

# ===================================
# Hermes
# ===================================
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# ===================================
# React Native Reanimated
# ===================================
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# ===================================
# Expo Modules
# ===================================
-keepclassmembers class * {
  @expo.modules.** *;
}
-keep class expo.modules.** { *; }
-keepclassmembers class * implements expo.modules.core.interfaces.Package {
  public <methods>;
}

# ===================================
# OkHttp (used by React Native)
# ===================================
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# ===================================
# Fresco (Image Loading)
# ===================================
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip
-keep @com.facebook.common.internal.DoNotStrip class *
-keepclassmembers class * {
  @com.facebook.common.internal.DoNotStrip *;
}

-dontwarn javax.annotation.**
-dontwarn com.android.volley.toolbox.**

# ===================================
# JSC (JavaScriptCore)
# ===================================
-keep class org.webkit.** { *; }

# ===================================
# Kotlin
# ===================================
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings {
    <fields>;
}
-keep class kotlin.Metadata { *; }
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}

# ===================================
# Camera and Vision
# ===================================
-keep class com.mrousavy.camera.** { *; }
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.vision.** { *; }

# ===================================
# General Android
# ===================================
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# ===================================
# Expo Device dependencies
# ===================================
-keep class com.facebook.device.yearclass.** { *; }

# ===================================
# Expo Application dependencies
# ===================================
-keep class com.android.installreferrer.** { *; }
`;

            // Read existing proguard rules
            let existingRules = '';
            if (fs.existsSync(proguardPath)) {
                existingRules = fs.readFileSync(proguardPath, 'utf-8');
            }

            // Append custom rules if not already present
            if (!existingRules.includes('React Native Core')) {
                const updatedRules = existingRules + customRules;
                fs.writeFileSync(proguardPath, updatedRules, 'utf-8');
            }

            return config;
        },
    ]);

    return config;
};

module.exports = withCustomAndroidConfig;
