const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

try {
    fs.copyFileSync(
        path.join(__dirname, 'node_modules/app-builder-lib/templates/icons/proton-native/linux/512x512.png'),
        path.join(__dirname, 'build/icon.png')
    );
    execSync('npx png-to-ico build/icon.png > build/icon.ico', { stdio: 'inherit', cwd: __dirname });
    console.log('Successfully copied and converted icon!');
} catch (err) {
    console.error('Error generating icons:', err);
    process.exit(1);
}
