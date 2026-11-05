/**
 * Automated Tests: Settings Loading & Updating
 */

import { getConfig, updateConfig } from '../config/settings.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

export async function runSettingsTests() {
  console.log('--- Testing Settings & Configuration ---');

  // Test 1: Load default config
  const config = getConfig();
  assert(config.assistant_name === 'JARVIS', 'Default assistant name should be JARVIS');
  assert(config.version === '0.1.0', 'Version should be 0.1.0');
  assert(typeof config.offline_mode === 'boolean', 'Offline mode should be boolean');
  assert(config.memory.enabled === true, 'Memory should be enabled by default');

  // Test 2: Update configuration
  const originalName = config.assistant_name;
  const updated = updateConfig({ assistant_name: 'JARVIS-Prime' });
  assert(updated.assistant_name === 'JARVIS-Prime', 'Assistant name should be updated');

  // Restore original
  updateConfig({ assistant_name: originalName });
  assert(getConfig().assistant_name === originalName, 'Assistant name should be restored');

  console.log('✓ All Settings tests passed.');
}

if (import.meta.url.endsWith(process.argv[1] || '')) {
  runSettingsTests().catch((err) => {
    console.error('Settings test failed:', err);
    process.exit(1);
  });
}
