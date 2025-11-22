#!/usr/bin/env node
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import * as readline from 'readline';

const packageJsonPath = join(process.cwd(), 'package.json');
const appJsonPath = join(process.cwd(), 'app.json');

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const appJson = JSON.parse(readFileSync(appJsonPath, 'utf-8'));

const currentVersion = packageJson.version;

console.log(`Current version: ${currentVersion}`);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Do you want to bump the version? (y/N) ', (answer) => {
    if (answer.toLowerCase() === 'y') {
        rl.question('Which version to bump? (1: Patch [default], 2: Minor, 3: Major) ', (type) => {
            const parts = currentVersion.split('.').map(Number);

            switch (type.trim()) {
                case '2':
                    parts[1] += 1;
                    parts[2] = 0;
                    break;
                case '3':
                    parts[0] += 1;
                    parts[1] = 0;
                    parts[2] = 0;
                    break;
                default:
                    parts[2] += 1;
                    break;
            }

            const newVersion = parts.join('.');

            packageJson.version = newVersion;
            appJson.expo.version = newVersion;

            writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
            writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

            console.log(`\nVersion bumped to ${newVersion}`);
            console.log('\nUpdated files:');
            console.log('  - package.json');
            console.log('  - app.json');
            console.log('\nNote: Version is also displayed in:');
            console.log('  - app/settings.tsx (via Constants.expoConfig.version)');
            console.log('  - app/about.tsx (via Constants.expoConfig.version)');

            const { execSync } = require('child_process');
            try {
                execSync(`git add package.json app.json`);
                console.log('\nFiles staged for commit.');
            } catch (e) {
                console.error("\nFailed to add updated version files to git");
            }
            rl.close();
            process.exit(0);
        });
    } else {
        console.log('Version not changed.');
        rl.close();
        process.exit(0);
    }
});
