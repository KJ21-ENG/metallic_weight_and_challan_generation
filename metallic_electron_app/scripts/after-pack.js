const fs = require('fs');
const path = require('path');

module.exports = async function(context) {
  try {
    const appOutDir = context.appOutDir || path.join(__dirname, '..', 'dist-app', 'win-unpacked');
    const buildResources = path.join(appOutDir, 'resources', 'server-dist', 'package.json');
    if (fs.existsSync(buildResources)) {
      const pkg = JSON.parse(fs.readFileSync(buildResources, 'utf8'));
      if (pkg.type && pkg.type === 'module') {
        delete pkg.type;
        fs.writeFileSync(buildResources, JSON.stringify(pkg, null, 2), 'utf8');
        console.log('after-pack: removed type from server-dist/package.json');
      }
    }
  } catch (e) {
    console.error('after-pack error', e);
  }
};


