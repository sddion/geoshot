const { withAppBuildGradle } = require('@expo/config-plugins');

const withAndroidSplits = (config) => {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = addSplitsBlock(config.modResults.contents);
        } else {
            throw new Error('Cannot add splits to build.gradle because it is not groovy');
        }
        return config;
    });
};

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

    // Insert before android { ... } block closes, or just inside it.
    // A safe place is usually after 'androidResources { ... }' or at the end of 'android { ... }'.
    // We'll look for the closing brace of the android block.
    // But regex is tricky. Let's try to find a known anchor.

    const anchor = 'androidResources {';
    if (buildGradle.includes(anchor)) {
        // Insert splits block BEFORE androidResources
        return buildGradle.replace(anchor, `${splitsBlock}\n    ${anchor}`);
    }

    // Fallback: Append to end of android block if we can find it?
    // Easier: Just replace 'android {' with 'android {\n' + splitsBlock
    // But splits usually goes inside android {}.

    return buildGradle.replace(
        /android\s*{/,
        `android {\n${splitsBlock}`
    );
}

export default withAndroidSplits;
