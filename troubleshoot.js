#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
    try {
        return execSync(command, {
            stdio: 'inherit',
            encoding: 'utf8',
            ...options
        });
    } catch (error) {
        log(`❌ Error executing command: ${command}`, 'red');
        throw error;
    }
}

function execCommandSilent(command, options = {}) {
    try {
        return execSync(command, {
            stdio: 'pipe',
            encoding: 'utf8',
            ...options
        });
    } catch (error) {
        return null;
    }
}

function wait(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function checkDockerStatus() {
    log('🔍 Checking Docker status...', 'yellow');

    try {
        const dockerVersion = execCommandSilent('docker --version');
        if (dockerVersion) {
            log('✅ Docker is installed', 'green');
        } else {
            log('❌ Docker is not installed or not in PATH', 'red');
            return false;
        }

        const composeVersion = execCommandSilent('docker-compose --version');
        if (composeVersion) {
            log('✅ Docker Compose is installed', 'green');
        } else {
            log('❌ Docker Compose is not installed or not in PATH', 'red');
            return false;
        }

        const dockerInfo = execCommandSilent('docker info');
        if (dockerInfo) {
            log('✅ Docker daemon is running', 'green');
        } else {
            log('❌ Docker daemon is not running', 'red');
            return false;
        }

        return true;
    } catch (error) {
        log(`❌ Docker check failed: ${error.message}`, 'red');
        return false;
    }
}

async function checkServiceStatus() {
    log('📊 Checking service status...', 'yellow');

    try {
        const psOutput = execCommandSilent('docker-compose ps');
        if (psOutput) {
            log('Service status:', 'cyan');
            console.log(psOutput);

            // Check if all services are running
            const lines = psOutput.split('\n');
            let allRunning = true;

            for (const line of lines) {
                if (line.includes('compound-')) {
                    if (!line.includes('Up')) {
                        allRunning = false;
                        log(`❌ Service not running: ${line}`, 'red');
                    }
                }
            }

            if (allRunning) {
                log('✅ All services are running', 'green');
                return true;
            } else {
                log('❌ Some services are not running', 'red');
                return false;
            }
        } else {
            log('❌ Could not get service status', 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Service status check failed: ${error.message}`, 'red');
        return false;
    }
}

async function checkMinIOHealth() {
    log('🔍 Checking MinIO health...', 'yellow');

    try {
        // Check if MinIO container is running
        const minioStatus = execCommandSilent('docker ps --format "table {{.Names}}\t{{.Status}}" | findstr compound-minio');
        if (!minioStatus || !minioStatus.includes('compound-minio')) {
            log('❌ MinIO container is not running', 'red');
            return false;
        }

        // Check MinIO logs
        log('📋 Recent MinIO logs:', 'cyan');
        const minioLogs = execCommandSilent('docker logs compound-minio --tail 15');
        if (minioLogs) {
            console.log(minioLogs);
        }

        // Test MinIO connection
        const mcTest = execCommandSilent('docker exec compound-minio mc alias set test http://localhost:9000 minioadmin minioadmin');
        if (mcTest === null) {
            log('❌ MinIO connection failed', 'red');
            return false;
        }

        // Check bucket
        const bucketTest = execCommandSilent('docker exec compound-minio mc ls test/compound-uploads');
        if (bucketTest === null) {
            log('❌ Bucket "compound-uploads" not accessible', 'red');
            return false;
        }

        log('✅ MinIO is healthy', 'green');
        return true;
    } catch (error) {
        log(`❌ MinIO health check failed: ${error.message}`, 'red');
        return false;
    }
}

async function checkBackendHealth() {
    log('🔍 Checking backend health...', 'yellow');

    try {
        // Check if backend container is running
        const backendStatus = execCommandSilent('docker ps --format "table {{.Names}}\t{{.Status}}" | findstr compound-backend');
        if (!backendStatus || !backendStatus.includes('compound-backend')) {
            log('❌ Backend container is not running', 'red');
            return false;
        }

        // Check backend logs
        log('📋 Recent backend logs:', 'cyan');
        const backendLogs = execCommandSilent('docker logs compound-backend --tail 15');
        if (backendLogs) {
            console.log(backendLogs);
        }

        // Test backend API
        const apiTest = execCommandSilent('curl -f http://localhost/health');
        if (apiTest === null) {
            log('❌ Backend API not responding', 'red');
            return false;
        }

        log('✅ Backend is healthy', 'green');
        return true;
    } catch (error) {
        log(`❌ Backend health check failed: ${error.message}`, 'red');
        return false;
    }
}

async function fixMinIOIssues() {
    log('🔧 Attempting to fix MinIO issues...', 'yellow');

    try {
        // Restart MinIO
        log('🔄 Restarting MinIO...', 'yellow');
        execCommandSilent('docker-compose restart minio');
        await wait(10);

        // Wait for MinIO to be ready
        log('⏳ Waiting for MinIO to be ready...', 'yellow');
        await wait(15);

        // Create bucket if it doesn't exist
        log('📦 Creating bucket if needed...', 'yellow');
        execCommandSilent('docker exec compound-minio mc mb test/compound-uploads');
        execCommandSilent('docker exec compound-minio mc anonymous set download test/compound-uploads');
        execCommandSilent('docker exec compound-minio mc policy set download test/compound-uploads');

        log('✅ MinIO fixes applied', 'green');
        return true;
    } catch (error) {
        log(`❌ MinIO fix failed: ${error.message}`, 'red');
        return false;
    }
}

async function restartAllServices() {
    log('🔄 Restarting all services...', 'yellow');

    try {
        // Stop all services
        log('⏹️  Stopping all services...', 'yellow');
        execCommandSilent('docker-compose down');
        execCommandSilent('docker-compose down --remove-orphans');

        // Start services
        log('▶️  Starting all services...', 'yellow');
        execCommand('docker-compose up -d');

        // Wait for services to be ready
        log('⏳ Waiting for services to be ready...', 'yellow');
        await wait(30);

        log('✅ All services restarted', 'green');
        return true;
    } catch (error) {
        log(`❌ Service restart failed: ${error.message}`, 'red');
        return false;
    }
}

async function runFullDiagnostic() {
    log('🚀 Running full diagnostic...', 'green');
    log('');

    // Check Docker
    const dockerOk = await checkDockerStatus();
    if (!dockerOk) {
        log('❌ Docker issues detected. Please install Docker Desktop and ensure it\'s running.', 'red');
        return false;
    }
    log('');

    // Check service status
    const servicesOk = await checkServiceStatus();
    if (!servicesOk) {
        log('❌ Service issues detected.', 'red');
        log('Attempting to restart services...', 'yellow');
        await restartAllServices();
        await wait(10);
        await checkServiceStatus();
    }
    log('');

    // Check MinIO health
    const minioOk = await checkMinIOHealth();
    if (!minioOk) {
        log('❌ MinIO issues detected.', 'red');
        log('Attempting to fix MinIO...', 'yellow');
        await fixMinIOIssues();
        await wait(10);
        await checkMinIOHealth();
    }
    log('');

    // Check backend health
    const backendOk = await checkBackendHealth();
    if (!backendOk) {
        log('❌ Backend issues detected.', 'red');
    }
    log('');

    log('✅ Full diagnostic completed', 'green');
    return dockerOk && servicesOk && minioOk && backendOk;
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.length === 0) {
        log('🔧 Compound Chemistry Data Manager - Troubleshooting Tool', 'cyan');
        log('');
        log('Usage:', 'white');
        log('  node troubleshoot.js                    - Run full diagnostic', 'white');
        log('  node troubleshoot.js --docker          - Check Docker status', 'white');
        log('  node troubleshoot.js --services        - Check service status', 'white');
        log('  node troubleshoot.js --minio           - Check MinIO health', 'white');
        log('  node troubleshoot.js --backend         - Check backend health', 'white');
        log('  node troubleshoot.js --fix-minio       - Fix MinIO issues', 'white');
        log('  node troubleshoot.js --restart         - Restart all services', 'white');
        log('');
        log('Common Issues and Solutions:', 'cyan');
        log('  1. "Access Denied" on upload: Run --fix-minio or --restart', 'white');
        log('  2. Images show "URL ngoài": Check MinIO health', 'white');
        log('  3. Services not starting: Check Docker status', 'white');
        log('  4. Upload fails: Check backend logs', 'white');
        log('');
        return;
    }

    try {
        if (args.includes('--docker')) {
            await checkDockerStatus();
        } else if (args.includes('--services')) {
            await checkServiceStatus();
        } else if (args.includes('--minio')) {
            await checkMinIOHealth();
        } else if (args.includes('--backend')) {
            await checkBackendHealth();
        } else if (args.includes('--fix-minio')) {
            await fixMinIOIssues();
        } else if (args.includes('--restart')) {
            await restartAllServices();
        } else {
            await runFullDiagnostic();
        }
    } catch (error) {
        log(`❌ Troubleshooting failed: ${error.message}`, 'red');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        log(`❌ Unexpected error: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = {
    checkDockerStatus,
    checkServiceStatus,
    checkMinIOHealth,
    checkBackendHealth,
    fixMinIOIssues,
    restartAllServices,
    runFullDiagnostic
};
