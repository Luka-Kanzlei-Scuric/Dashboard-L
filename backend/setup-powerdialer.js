/**
 * PowerDialer Setup Script
 * 
 * This script helps with initializing the configuration for the PowerDialer system.
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

console.log('📋 Using in-memory queue system (no Redis required)');
setupEnvFile();

function setupEnvFile() {
  console.log('\n🔧 Setting up environment variables...');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  // Check if .env file exists
  if (fs.existsSync(envPath)) {
    console.log('ℹ️  .env file already exists');
    
    // Check if PowerDialer variables are in the .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('AIRCALL_API_KEY')) {
      console.log('ℹ️  Adding PowerDialer configuration to existing .env file');
      
      rl.question('\n👉 Do you want to enable mock mode for testing? (y/n): ', answer => {
        const mockMode = answer.toLowerCase() === 'y';
        
        const powerDialerConfig = `
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
  console.log('\n🎉 PowerDialer setup is complete!');
  console.log('\n📋 Next steps:');
  console.log('  1. Make sure MongoDB is configured and running');
  console.log('  2. Update your Aircall API credentials in .env (if not using mock mode)');
  console.log('  3. Start the server with: npm run dev or yarn dev');
  console.log('  4. Access the PowerDialer at: http://localhost:3000/power-dialer');
  
  console.log('\n📚 For more information, check the documentation:');
  console.log('  • Backend README: backend/README_POWERDIALER.md');
  console.log('  • Implementation Summary: PowerDialer_Implementation_Summary.md');
  
  rl.close();
}

// Handle readline close event
rl.on('close', () => {
  console.log('\n👋 PowerDialer setup script finished.');
});