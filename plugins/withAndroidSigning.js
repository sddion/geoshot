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
    // If the signing config is already present, do nothing
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

    // Replace the default debug signing config (or insert if missing)
    return buildGradle.replace(/signingConfig signingConfigs.debug/g, `signingConfig signingConfigs.debug${signingBlock}`);
}

module.exports = withAndroidSigning;
