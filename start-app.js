#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m'
};

function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
    try {
        log(`🔄 ${description}...`, 'yellow');
        execSync(command, { stdio: 'inherit' });
        log(`✅ ${description} completed`, 'green');
        return true;
    } catch (error) {
        log(`❌ ${description} failed: ${error.message}`, 'red');
        return false;
    }
}

function checkFileExists(file) {
    return fs.existsSync(file);
}

function fixLineEndings() {
    log('🔧 Step 1: Fixing line endings...', 'yellow');

    // Use the cross-platform Node.js script
    if (checkFileExists('fix-line-endings.js')) {
        log('🔄 Using cross-platform line ending fix...', 'yellow');
        return runCommand('node fix-line-endings.js', 'Fixing line endings');
    } else {
        log('⚠️  No line ending fix script found, skipping...', 'yellow');
        return true;
    }
}

async function startApp() {
    log('🚀 Starting Compound Chemistry Application...', 'blue');
    log('', 'white');

    // Step 1: Fix line endings if needed
    if (!fixLineEndings()) {
        log('⚠️  Line ending fixes failed, continuing anyway...', 'yellow');
        log('', 'white');
    }

    // Step 2: Start the application
    log('🚀 Step 2: Starting application...', 'yellow');
    if (runCommand('node deploy.js', 'Deploying application')) {
        log('', 'white');

        // Step 3: Run diagnostics
        log('🔍 Step 3: Running diagnostics...', 'yellow');
        runCommand('node deploy.js --diagnose', 'Running diagnostics');
        log('', 'white');

        // Step 4: Show success message
        log('🎉 Application is ready!', 'green');
        log('', 'white');
        log('📱 Access your application at:', 'blue');
        log('   • Main App: http://localhost', 'white');
        log('   • MinIO Console: http://localhost:9001 (admin/minioadmin)', 'white');
        log('', 'white');
        log('💡 To stop the app: docker-compose down', 'yellow');
        log('💡 To restart: node start-app.js', 'yellow');
    } else {
        log('', 'white');
        log('❌ Failed to start application', 'red');
        log('💡 Try running: node troubleshoot.js', 'yellow');
        process.exit(1);
    }
}

// Run the startup process
startApp().catch(error => {
    log(`❌ Startup failed: ${error.message}`, 'red');
    process.exit(1);
});
