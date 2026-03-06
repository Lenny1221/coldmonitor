#!/usr/bin/env node
/**
 * Fix CapacitorPreferences path in CapApp-SPM Package.swift.
 * Xcode SPM sometimes fails to resolve ../../../node_modules path.
 * We copy the plugin locally and use a shorter path.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.resolve(__dirname, '..');
const prefsSrc = path.join(root, 'node_modules', '@capacitor', 'preferences');
const prefsDest = path.join(root, 'ios', 'App', 'CapacitorPreferences');
const packageSwift = path.join(root, 'ios', 'App', 'CapApp-SPM', 'Package.swift');

if (!fs.existsSync(prefsSrc)) {
  console.error('@capacitor/preferences not found in node_modules');
  process.exit(1);
}

// Copy preferences to ios/App
if (fs.existsSync(prefsDest)) fs.rmSync(prefsDest, { recursive: true });
fs.cpSync(prefsSrc, prefsDest, { recursive: true });

// Fix path in Package.swift
let content = fs.readFileSync(packageSwift, 'utf8');
content = content.replace(
  /path: "\.\.\/\.\.\/\.\.\/node_modules\/@capacitor\/preferences"/,
  'path: "../CapacitorPreferences"'
);
fs.writeFileSync(packageSwift, content);

console.log('✓ CapacitorPreferences path fixed for Xcode SPM');
