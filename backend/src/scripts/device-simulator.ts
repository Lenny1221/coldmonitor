/**
 * Device Simulator Script
 * 
 * This script simulates a temperature logger device sending data to the backend.
 * Useful for testing without physical hardware.
 * 
 * Usage:
 *   tsx src/scripts/device-simulator.ts <deviceId> [interval]
 * 
 * Example:
 *   tsx src/scripts/device-simulator.ts DEVICE-001 300000
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3001';
const deviceId = process.argv[2];
const interval = parseInt(process.argv[3] || '300000', 10); // Default 5 minutes

if (!deviceId) {
  console.error('Usage: tsx device-simulator.ts <deviceId> [interval_ms]');
  console.error('Example: tsx device-simulator.ts DEVICE-001 300000');
  process.exit(1);
}

let baseTemperature = 4.0; // Base temperature in Celsius
let isIncreasing = false;

// Simulate temperature fluctuations
function generateTemperature(): number {
  // Simulate some realistic temperature variation
  const variation = (Math.random() - 0.5) * 2; // -1 to +1 degree
  baseTemperature += (Math.random() - 0.5) * 0.2; // Small drift
  
  // Keep temperature within reasonable range
  if (baseTemperature > 8) {
    baseTemperature = 7.5;
    isIncreasing = false;
  } else if (baseTemperature < 1) {
    baseTemperature = 1.5;
    isIncreasing = true;
  }
  
  return Math.round((baseTemperature + variation) * 10) / 10;
}

async function sendTemperature() {
  const temperature = generateTemperature();
  const timestamp = new Date().toISOString();

  try {
    const response = await axios.post(
      `${API_URL}/api/devices/${deviceId}/data`,
      {
        temperature,
        timestamp,
      }
    );

    console.log(
      `[${new Date().toLocaleString()}] Device: ${deviceId}, Temp: ${temperature}°C, Status: ${response.data.status}`
    );
  } catch (error: any) {
    if (error.response) {
      console.error(
        `[${new Date().toLocaleString()}] Error: ${error.response.data.error || error.response.statusText}`
      );
    } else {
      console.error(`[${new Date().toLocaleString()}] Error: ${error.message}`);
    }
  }
}

console.log(`Starting device simulator for: ${deviceId}`);
console.log(`Interval: ${interval / 1000} seconds`);
console.log(`API URL: ${API_URL}`);
console.log('Press Ctrl+C to stop\n');

// Send initial temperature
sendTemperature();

// Set up interval
const intervalId = setInterval(sendTemperature, interval);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nStopping device simulator...');
  clearInterval(intervalId);
  process.exit(0);
});
