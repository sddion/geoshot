const { withAppBuildGradle } = require('@expo/config-plugins');

function withAndroidSplits(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addSplitsBlock(config.modResults.contents);
    } else {
      throw new Error('Cannot add splits to build.gradle because it is not groovy');
    }
    return config;
  });
}

function addSplitsBlock(buildGradle) {
  if (buildGradle.includes('splits {')) {
    return buildGradle;
  }

  const splitsBlock = `
    splits {
      abi {
        enable true
        reset()
        include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        universalApk true
      }
    }
  `;

  const anchor = 'androidResources {';
  if (buildGradle.includes(anchor)) {
    // Insert before the androidResources block
    return buildGradle.replace(anchor, `${splitsBlock}\n    ${anchor}`);
  }

  // Fallback: insert right after the opening android { line
  return buildGradle.replace(/android\s*{/, `android {\n${splitsBlock}`);
}

module.exports = withAndroidSplits;
