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

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    const platform = os.platform();

    // Try to get the first non-loopback IPv4 address
    for (const name of Object.keys(interfaces)) {
        for (const networkInterface of interfaces[name]) {
            // Skip internal and non-IPv4 addresses
            if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
                // Skip Docker and virtual interfaces on Linux
                if (platform === 'linux' && (name.includes('docker') || name.includes('veth'))) {
                    continue;
                }
                return networkInterface.address;
            }
        }
    }

    // Fallback: try to get IP using system commands
    try {
        if (platform === 'win32') {
            // Windows: use ipconfig
            const result = execSync('ipconfig', { encoding: 'utf8' });
            const lines = result.split('\n');
            for (const line of lines) {
                if (line.includes('IPv4') && !line.includes('127.0.0.1')) {
                    const match = line.match(/(\d+\.\d+\.\d+\.\d+)/);
                    if (match) return match[1];
                }
            }
        } else {
            // Unix-like: try ifconfig or ip
            try {
                const result = execSync('ifconfig', { encoding: 'utf8' });
                const lines = result.split('\n');
                for (const line of lines) {
                    if (line.includes('inet ') && !line.includes('127.0.0.1')) {
                        const match = line.match(/inet (\d+\.\d+\.\d+\.\d+)/);
                        if (match) return match[1];
                    }
                }
            } catch (error) {
                // Try ip command as fallback
                try {
                    const result = execSync('ip route get 1.1.1.1', { encoding: 'utf8' });
                    const match = result.match(/src (\d+\.\d+\.\d+\.\d+)/);
                    if (match) return match[1];
                } catch (ipError) {
                    // Ignore and continue to fallback
                }
            }
        }
    } catch (error) {
        // Ignore and continue to fallback
    }

    return 'localhost';
}

function createDirectories() {
    const dirs = ['db/data', 'uploads'];

    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            log(`📁 Created directory: ${dir}`, 'green');
        }
    }
}

function wait(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function deploy() {
    try {
        log('🚀 Deploying Compound Chemistry Data Manager...', 'green');

        // Auto-detect LAN IP
        log('🔍 Detecting LAN IP address...', 'yellow');
        const lanIP = getLocalIP();
        log(`✅ Detected LAN IP: ${lanIP}`, 'green');

        // Create necessary directories
        log('📁 Creating necessary directories...', 'yellow');
        createDirectories();

        // Set proper permissions (Unix-like systems only)
        if (os.platform() !== 'win32') {
            log('🔐 Setting proper permissions...', 'yellow');
            try {
                execSync('chmod 755 uploads', { stdio: 'ignore' });
            } catch (error) {
                log('⚠️  Could not set permissions (this is normal on Windows)', 'yellow');
            }
        }

        // Build and start the application
        log('🔨 Building and starting the application...', 'yellow');
        execCommand('docker-compose down');
        execCommand('docker-compose up --build -d');

        // Wait for services to be ready
        log('⏳ Waiting for services to be ready...', 'yellow');
        await wait(15);

        // Check service status
        log('📊 Checking service status...', 'yellow');
        execCommand('docker-compose ps');

        // Display results
        log('✅ Deployment complete!', 'green');
        log('');
        log('🌐 Application URLs:', 'cyan');
        log(`   Frontend: http://${lanIP}`, 'white');
        log(`   Backend API: http://${lanIP}/api`, 'white');
        log(`   S3/MinIO: http://${lanIP}/s3`, 'white');
        log(`   Health Check: http://${lanIP}/health`, 'white');
        log('');
        log('📱 Mobile Access:', 'cyan');
        log('   Your app is now configured for mobile access!', 'white');
        log('   Make sure your mobile device is on the same WiFi network', 'white');
        log(`   Access from mobile: http://${lanIP}`, 'white');
        log('');
        log('🔧 Useful commands:', 'cyan');
        log('   View logs: docker-compose logs -f', 'white');
        log('   Stop services: docker-compose down', 'white');
        log('   Restart services: docker-compose restart', 'white');
        log('   View nginx logs: docker-compose logs nginx', 'white');
        log('   View frontend logs: docker-compose logs frontend', 'white');
        log('   View backend logs: docker-compose logs backend', 'white');
        log('');
        log('🛠️  Troubleshooting:', 'cyan');
        log('   If mobile access doesn\'t work, check your firewall settings:', 'white');

        const platform = os.platform();
        if (platform === 'win32') {
            log('   - Windows: Windows Defender Firewall', 'white');
        } else if (platform === 'darwin') {
            log('   - macOS: System Preferences > Security & Privacy > Firewall', 'white');
        } else {
            log('   - Linux: sudo ufw status', 'white');
        }

        log('');
        log('📋 Architecture:', 'cyan');
        log('   All services are now routed through nginx on port 80:', 'white');
        log('   - Frontend: / (static files)', 'white');
        log('   - Backend API: /api/*', 'white');
        log('   - S3/MinIO: /s3/*', 'white');
        log('   - Health Check: /health', 'white');

    } catch (error) {
        log(`❌ Deployment failed: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Check if Docker is available
function checkDocker() {
    try {
        execSync('docker --version', { stdio: 'ignore' });
        execSync('docker-compose --version', { stdio: 'ignore' });
        return true;
    } catch (error) {
        log('❌ Docker or Docker Compose is not installed or not in PATH', 'red');
        log('Please install Docker Desktop and ensure it\'s running', 'yellow');
        return false;
    }
}

// Main execution
if (require.main === module) {
    if (!checkDocker()) {
        process.exit(1);
    }

    deploy().catch(error => {
        log(`❌ Unexpected error: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = { deploy, getLocalIP, createDirectories };
