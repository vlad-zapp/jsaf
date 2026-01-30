#!/usr/bin/env node
'use strict';

const esbuild = require('esbuild');
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

// Plugin: mark native .node addons as external.
// ssh2 has optional native crypto bindings with pure JS fallbacks.
const nativeModulesPlugin = {
  name: 'native-node-modules',
  setup(build) {
    build.onResolve({ filter: /\.node$/ }, (args) => ({
      path: args.path,
      external: true,
    }));
  },
};

async function main() {
  // Clean
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });

  // Step 1: Bundle all source + deps into a single CJS file
  console.log('Bundling with esbuild...');
  await esbuild.build({
    entryPoints: [path.join(root, 'bin', 'jsaf.js')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outfile: path.join(dist, 'jsaf.cjs'),
    // bin/jsaf.js already has a shebang — esbuild preserves it
    plugins: [nativeModulesPlugin],
    logLevel: 'warning',
  });

  const bundleSize = fs.statSync(path.join(dist, 'jsaf.cjs')).size;
  console.log(`  dist/jsaf.cjs (${(bundleSize / 1024).toFixed(0)} KB)\n`);

  // Step 2: Write a temporary package.json for pkg so it has a clear entry point
  fs.writeFileSync(
    path.join(dist, 'package.json'),
    JSON.stringify({ name: 'jsaf', bin: 'jsaf.cjs' })
  );

  // Step 3: Create standalone binaries with pkg
  // --no-bytecode: required because V8 bytecode can't be cross-compiled
  //                (x64 host can't generate arm64 bytecode). Without this
  //                the macOS ARM64 binary ships with no embedded code.
  console.log('Creating standalone binaries with pkg...');
  console.log('  (pkg caches Node.js base binaries locally for embedding)\n');

  const targets = [
    'node20-linux-x64',
    'node20-macos-x64',
    'node20-macos-arm64',
    'node20-win-x64',
  ];

  execFileSync(
    process.execPath,
    [
      path.join(root, 'node_modules', '.bin', 'pkg'),
      path.join(dist, 'package.json'),
      '--targets', targets.join(','),
      '--output', path.join(dist, 'jsaf'),
      '--no-bytecode',
      '--public',
      '--compress', 'GZip',
    ],
    { stdio: 'inherit', cwd: root }
  );

  // Clean up temp package.json
  fs.unlinkSync(path.join(dist, 'package.json'));

  console.log('\nBuild complete:\n');
  for (const f of fs.readdirSync(dist).sort()) {
    const s = fs.statSync(path.join(dist, f));
    const mb = (s.size / 1024 / 1024).toFixed(1);
    const kb = (s.size / 1024).toFixed(0);
    const size = s.size > 1024 * 1024 ? `${mb} MB` : `${kb} KB`;
    console.log(`  dist/${f}  (${size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
