const { withProjectBuildGradle } = require('@expo/config-plugins');

function withDisableLint(config) {
    // Add lint disable configuration to project-level build.gradle
    config = withProjectBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = addLintDisable(config.modResults.contents);
        }
        return config;
    });

    return config;
}

function addLintDisable(buildGradle) {
    // Check if we already added the lint disable code
    if (buildGradle.includes('lintVital') && buildGradle.includes('task.enabled = false')) {
        return buildGradle;
    }

    const lintDisableBlock = `
// Disable lint tasks for release builds to avoid OOM on CI
gradle.taskGraph.whenReady { graph ->
    graph.allTasks.findAll { it.name.contains('lintVital') }.each { task ->
        task.enabled = false
    }
}
`;

    // Insert after the buildscript block
    const buildscriptEnd = /buildscript\s*{[^}]*}\s*/;
    if (buildscriptEnd.test(buildGradle)) {
        return buildGradle.replace(buildscriptEnd, (match) => {
            return match + '\n' + lintDisableBlock;
        });
    }

    // Fallback: add at the beginning
    return lintDisableBlock + '\n' + buildGradle;
}

module.exports = withDisableLint;
