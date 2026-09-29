const { spawnSync } = require('child_process');

function isElectronInstalled() {
  try {
    require('electron/package.json');
    return true;
  } catch {
    return false;
  }
}

function main() {
  if (!isElectronInstalled()) {
    console.warn('electron is not installed; skipping native rebuild.');
    return;
  }

  console.log('Rebuilding native modules for Electron...');

  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(npxCmd, [
    '--yes',
    '@electron/rebuild',
    '--force',
    '--only', 'better-sqlite3',
  ], { stdio: 'inherit' });

  if (result.error) {
    console.error('Failed to run electron rebuild:', result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

main();
