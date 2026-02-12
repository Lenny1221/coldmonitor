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
