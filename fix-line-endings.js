#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

function fixLineEndings(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            log(`⚠️  File not found: ${filePath}`, 'yellow');
            return false;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;

        // Replace Windows line endings (CRLF) with Unix line endings (LF)
        content = content.replace(/\r\n/g, '\n');

        // Only write if content actually changed
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            log(`✅ Fixed line endings in ${filePath}`, 'green');
            return true;
        } else {
            log(`ℹ️  No line ending changes needed for ${filePath}`, 'blue');
            return true;
        }
    } catch (error) {
        log(`❌ Failed to fix ${filePath}: ${error.message}`, 'red');
        return false;
    }
}

function main() {
    log('🔧 Fixing line endings in shell scripts...', 'yellow');

    const files = [
        'minio-init.sh'
        // Only include files that actually exist in the project
    ];

    let successCount = 0;
    let totalCount = 0;

    for (const file of files) {
        totalCount++;
        if (fixLineEndings(file)) {
            successCount++;
        }
    }

    log('', 'white');
    log(`🎉 Line ending fixes completed!`, 'green');
    log(`✅ Fixed ${successCount}/${totalCount} files`, 'green');
    log('', 'white');

    if (successCount === totalCount) {
        log('💡 To restart MinIO initialization:', 'yellow');
        log('   docker-compose restart minio-init', 'white');
    } else {
        log('⚠️  Some files could not be fixed. Check permissions.', 'yellow');
    }
}

// Run the script
main();
