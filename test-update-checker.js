#!/usr/bin/env node

/**
 * Simple test script for update checker functionality
 * This tests the update checker without running the full CLI
 */

console.log('Testing Update Checker...\n');

// Mock package.json for testing
const mockPkg = {
  name: 'ghux',
  version: '1.0.0'
};

console.log(`Current version: ${mockPkg.version}`);
console.log('Checking for updates from npm registry...\n');

// Use update-notifier to check
import('update-notifier').then(({ default: updateNotifier }) => {
  const notifier = updateNotifier({
    pkg: mockPkg,
    updateCheckInterval: 0, // Force check immediately
    shouldNotifyInNpmScript: false,
  });

  // Manually fetch info
  notifier.fetchInfo().then(() => {
    if (notifier.update) {
      const { current, latest, type } = notifier.update;

      console.log('✓ Update check successful!');
      console.log(`  Current: ${current}`);
      console.log(`  Latest:  ${latest}`);
      console.log(`  Type:    ${type}`);
      console.log('\n📦 Update is available!');
      console.log(`   Run: npm install -g ghux`);
    } else {
      console.log('✓ You are using the latest version!');
      console.log(`  Version: ${mockPkg.version}`);
    }
  }).catch(err => {
    console.error('✗ Update check failed:', err.message);
    console.error('  This is normal if you are offline or npm registry is unreachable');
  });
}).catch(err => {
  console.error('✗ Could not load update-notifier:', err.message);
  console.error('  Make sure dependencies are installed: npm install');
});

setTimeout(() => {
  console.log('\nTest completed.');
}, 3000);
