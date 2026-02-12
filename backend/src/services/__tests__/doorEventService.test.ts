/**
 * Door event service validation tests
 * Run: npx tsx src/services/__tests__/doorEventService.test.ts
 */
import {
  validateDoorEventPayload,
  validateDoorEventBatchPayload,
} from '../doorEventService';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

console.log('Running door event validation tests...');

// validateDoorEventPayload
const valid = validateDoorEventPayload({
  device_id: 'DEV001',
  state: 'OPEN',
  timestamp: 1700000000000,
  seq: 1,
});
assert(valid.device_id === 'DEV001' && valid.state === 'OPEN', 'valid payload');
console.log('  ✓ validateDoorEventPayload: valid payload');

const closed = validateDoorEventPayload({
  device_id: 'DEV001',
  state: 'CLOSED',
  timestamp: 1700000000000,
  seq: 2,
});
assert(closed.state === 'CLOSED', 'CLOSED state');
console.log('  ✓ validateDoorEventPayload: CLOSED state');

try {
  validateDoorEventPayload({ device_id: 'DEV001', state: 'UNKNOWN', timestamp: 1700000000000, seq: 1 });
  assert(false, 'should throw');
} catch {
  console.log('  ✓ validateDoorEventPayload: invalid state throws');
}

try {
  validateDoorEventPayload({ state: 'OPEN', timestamp: 1700000000000, seq: 1 });
  assert(false, 'should throw');
} catch {
  console.log('  ✓ validateDoorEventPayload: missing device_id throws');
}

// validateDoorEventBatchPayload
const batch = validateDoorEventBatchPayload({
  device_id: 'DEV001',
  events: [
    { state: 'OPEN', timestamp: 1000, seq: 1 },
    { state: 'CLOSED', timestamp: 2000, seq: 2 },
  ],
});
assert(batch.events.length === 2 && batch.events[0].state === 'OPEN', 'valid batch');
console.log('  ✓ validateDoorEventBatchPayload: valid batch');

try {
  validateDoorEventBatchPayload({ device_id: 'DEV001', events: [] });
  assert(false, 'should throw');
} catch {
  console.log('  ✓ validateDoorEventBatchPayload: empty events throws');
}

console.log('\nAll tests passed.');
