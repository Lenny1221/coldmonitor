#include "door_events.h"

DoorEventManager::DoorEventManager()
  : lastStableTime(0),
    lastStableState(false),
    lastReportedState(false),
    queueHead(0),
    queueTail(0),
    queueCount(0),
    seqCounter(0),
    lastEventMs(0),
    eventsThisSecond(0) {
}

bool DoorEventManager::poll(bool currentDoorOpen) {
  unsigned long now = millis();
  
  // Debounce: state must be stable for DOOR_DEBOUNCE_MS
  if (currentDoorOpen != lastStableState) {
    lastStableTime = now;
    lastStableState = currentDoorOpen;
    return false;
  }
  
  if (now - lastStableTime < DOOR_DEBOUNCE_MS) {
    return false;
  }
  
  // State stable and different from last reported
  if (currentDoorOpen != lastReportedState) {
    lastReportedState = currentDoorOpen;
    return true;
  }
  
  return false;
}

void DoorEventManager::enqueue(const DoorEvent& ev) {
  if (queueCount >= DOOR_EVENT_QUEUE_SIZE) return;

  unsigned long now = millis();
  if (lastEventMs == 0 || (now - lastEventMs) >= 1000) {
    lastEventMs = now;
    eventsThisSecond = 0;
  }
  if (eventsThisSecond >= DOOR_MAX_EVENTS_PER_SECOND) return;

  eventsThisSecond++;

  queue[queueTail] = ev;
  queueTail = (queueTail + 1) % DOOR_EVENT_QUEUE_SIZE;
  queueCount++;
}

bool DoorEventManager::dequeue(DoorEvent& out) {
  if (queueCount == 0) return false;
  
  out = queue[queueHead];
  queueHead = (queueHead + 1) % DOOR_EVENT_QUEUE_SIZE;
  queueCount--;
  return true;
}

int DoorEventManager::dequeueMany(DoorEvent* out, int maxCount) {
  int n = 0;
  while (n < maxCount && queueCount > 0) {
    out[n] = queue[queueHead];
    queueHead = (queueHead + 1) % DOOR_EVENT_QUEUE_SIZE;
    queueCount--;
    n++;
  }
  return n;
}
