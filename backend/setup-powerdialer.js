/**
 * PowerDialer Setup Script
 * 
 * This script helps with installing the required dependencies for the PowerDialer system
 * and initializing its configuration.
 */

import fs from 'fs';
import { exec } from 'child_process';
import readline from 'readline';
import path from 'path';

// Setup readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 PowerDialer Setup Script');
console.log('===========================');
console.log('This script will help you set up the PowerDialer system.\n');

// Check if Redis is installed
console.log('📋 Checking for Redis...');
exec('redis-cli ping', (err, stdout) => {
  if (err || !stdout.includes('PONG')) {
    console.log('❌ Redis is not installed or not running!');
    console.log('ℹ️  Redis is required for the PowerDialer background job processing.');
    console.log('ℹ️  Please install Redis and make sure it\'s running before continuing.');
    console.log('\n📚 Installation instructions:');
    console.log('  • macOS: brew install redis && brew services start redis');
    console.log('  • Ubuntu: sudo apt install redis-server && sudo systemctl start redis-server');
    console.log('  • Windows: https://redis.io/download');
    
    askContinue();
  } else {
    console.log('✅ Redis is installed and running!');
    installDependencies();
  }
});

function askContinue() {
  rl.question('\n🤔 Do you want to continue anyway? (y/n): ', answer => {
    if (answer.toLowerCase() === 'y') {
      installDependencies();
    } else {
      console.log('\n🛑 Setup aborted. Please install Redis and try again.');
      rl.close();
    }
  });
}

function installDependencies() {
  console.log('\n📦 Installing required npm packages...');
  
  // Use npm or yarn based on what's available
  exec('which yarn', (err, stdout) => {
    const packageManager = stdout.trim() ? 'yarn' : 'npm';
    const installCmd = packageManager === 'yarn' ? 'yarn add' : 'npm install';
    
    const dependencies = [
      'bull@4.12.0',
      'redis@4.6.13'
    ];
    
    console.log(`Using ${packageManager} to install packages...`);
    exec(`${installCmd} ${dependencies.join(' ')}`, (err, stdout, stderr) => {
      if (err) {
        console.log(`❌ Error installing dependencies: ${err.message}`);
        console.log('Please install the following packages manually:');
        console.log('  • bull@4.12.0');
        console.log('  • redis@4.6.13');
      } else {
        console.log('✅ Dependencies installed successfully!');
      }
      
      setupEnvFile();
    });
  });
}

function setupEnvFile() {
  console.log('\n🔧 Setting up environment variables...');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  // Check if .env file exists
  if (fs.existsSync(envPath)) {
    console.log('ℹ️  .env file already exists');
    
    // Check if PowerDialer variables are in the .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('AIRCALL_API_KEY') || !envContent.includes('REDIS_HOST')) {
      console.log('ℹ️  Adding PowerDialer configuration to existing .env file');
      
      rl.question('\n👉 Do you want to enable mock mode for testing? (y/n): ', answer => {
        const mockMode = answer.toLowerCase() === 'y';
        
        const powerDialerConfig = `
# Redis Configuration for PowerDialer Background Jobs
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Aircall API Configuration
AIRCALL_API_KEY=test_key
AIRCALL_API_SECRET=test_secret

# PowerDialer Settings
ENABLE_MOCK_MODE=${mockMode}
FORCE_COMPLETE_MOCK=${mockMode}
`;
        
        fs.appendFileSync(envPath, powerDialerConfig);
        console.log('✅ PowerDialer configuration added to .env file');
        showNextSteps();
      });
    } else {
      console.log('✅ PowerDialer configuration already exists in .env file');
      showNextSteps();
    }
  } else {
    console.log('ℹ️  Creating .env file from example...');
    
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ Created .env file from example');
      
      rl.question('\n👉 Do you want to enable mock mode for testing? (y/n): ', answer => {
        const mockMode = answer.toLowerCase() === 'y';
        
        // Update the mock mode settings in the new .env file
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/ENABLE_MOCK_MODE=.*/, `ENABLE_MOCK_MODE=${mockMode}`);
        envContent = envContent.replace(/FORCE_COMPLETE_MOCK=.*/, `FORCE_COMPLETE_MOCK=${mockMode}`);
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Updated mock mode settings in .env file');
        showNextSteps();
      });
    } else {
      console.log('❌ .env.example file not found!');
      console.log('ℹ️  Please create a .env file manually with the required environment variables.');
      showNextSteps();
    }
  }
}

function showNextSteps() {
  console.log('\n🎉 PowerDialer setup is almost complete!');
  console.log('\n📋 Next steps:');
  console.log('  1. Make sure MongoDB is configured and running');
  console.log('  2. Update your Aircall API credentials in .env (if not using mock mode)');
  console.log('  3. Start the server with: npm run dev or yarn dev');
  console.log('  4. Access the PowerDialer at: http://localhost:3000/new-power-dialer');
  
  console.log('\n📚 For more information, check the documentation:');
  console.log('  • Backend README: backend/README_POWERDIALER.md');
  console.log('  • Implementation Summary: PowerDialer_Implementation_Summary.md');
  
  rl.close();
}

// Handle readline close event
rl.on('close', () => {
  console.log('\n👋 PowerDialer setup script finished.');
});