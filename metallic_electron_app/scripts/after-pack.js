const fs = require('fs');
const path = require('path');

module.exports = async function(context) {
  try {
    // No-op: keep server-dist/package.json as-is so ESM (type: module) remains intact.
    const appOutDir = context.appOutDir || path.join(__dirname, '..', 'dist-app', 'win-unpacked');
    const pkgPath = path.join(appOutDir, 'resources', 'server-dist', 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      console.log('after-pack: leaving server-dist/package.json unchanged (type=%s)', pkg.type || 'undefined');
    }
  } catch (e) {
    console.error('after-pack error', e);
  }
};


