const { withAppBuildGradle } = require('@expo/config-plugins');

const withAndroidSigning = (config) => {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = addSigningConfig(config.modResults.contents);
        } else {
            throw new Error('Cannot add signing config to build.gradle because it is not groovy');
        }
        return config;
    });
};

function addSigningConfig(buildGradle) {
    // Check if we already have the custom signing config
    if (buildGradle.includes('MYAPP_UPLOAD_STORE_FILE')) {
        return buildGradle;
    }

    const signingBlock = `
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
  `;

    // Replace the default release signing config or insert it.
    // The default template usually has: signingConfig signingConfigs.debug
    const target = 'signingConfig signingConfigs.debug';

    // We want to replace the one inside buildTypes { release { ... } }
    // This simple replace might be too aggressive if debug also uses it, but usually debug uses signingConfigs.debug explicitly.
    // Let's try to be specific.

    return buildGradle.replace(
        /signingConfig signingConfigs.debug/g,
        `signingConfig signingConfigs.debug\n${signingBlock}`
    );
}

module.exports = withAndroidSigning;
