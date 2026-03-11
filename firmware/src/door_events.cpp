#include "door_events.h"

DoorEventManager::DoorEventManager()
  : queueMutex(xSemaphoreCreateMutex()),
    lastStableTime(0),
    lastStableState(false),
    lastReportedState(false),
    queueHead(0),
    queueTail(0),
    queueCount(0),
    seqCounter(0),
    lastEventMs(0),
    eventsThisSecond(0) {
}

void DoorEventManager::setInitialState(bool currentDoorOpen) {
  lastStableState = currentDoorOpen;
  lastReportedState = currentDoorOpen;
  lastStableTime = millis();
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
  if (!queueMutex) return;
  if (xSemaphoreTake(queueMutex, pdMS_TO_TICKS(50)) != pdTRUE) return;
  if (queueCount >= DOOR_EVENT_QUEUE_SIZE) {
    xSemaphoreGive(queueMutex);
    return;
  }

  unsigned long now = millis();
  if (lastEventMs == 0 || (now - lastEventMs) >= 1000) {
    lastEventMs = now;
    eventsThisSecond = 0;
  }
  if (eventsThisSecond >= DOOR_MAX_EVENTS_PER_SECOND) {
    xSemaphoreGive(queueMutex);
    return;
  }

  eventsThisSecond++;

  queue[queueTail] = ev;
  queueTail = (queueTail + 1) % DOOR_EVENT_QUEUE_SIZE;
  queueCount++;
  xSemaphoreGive(queueMutex);
}

bool DoorEventManager::dequeue(DoorEvent& out) {
  if (!queueMutex || xSemaphoreTake(queueMutex, pdMS_TO_TICKS(50)) != pdTRUE) return false;
  if (queueCount == 0) {
    xSemaphoreGive(queueMutex);
    return false;
  }
  out = queue[queueHead];
  queueHead = (queueHead + 1) % DOOR_EVENT_QUEUE_SIZE;
  queueCount--;
  xSemaphoreGive(queueMutex);
  return true;
}

bool DoorEventManager::hasPending() {
  if (!queueMutex || xSemaphoreTake(queueMutex, pdMS_TO_TICKS(10)) != pdTRUE) return false;
  bool r = queueCount > 0;
  xSemaphoreGive(queueMutex);
  return r;
}

int DoorEventManager::getQueueCount() {
  if (!queueMutex || xSemaphoreTake(queueMutex, pdMS_TO_TICKS(10)) != pdTRUE) return 0;
  int r = queueCount;
  xSemaphoreGive(queueMutex);
  return r;
}

int DoorEventManager::dequeueMany(DoorEvent* out, int maxCount) {
  if (!queueMutex || xSemaphoreTake(queueMutex, pdMS_TO_TICKS(50)) != pdTRUE) return 0;
  int n = 0;
  while (n < maxCount && queueCount > 0) {
    out[n] = queue[queueHead];
    queueHead = (queueHead + 1) % DOOR_EVENT_QUEUE_SIZE;
    queueCount--;
    n++;
  }
  xSemaphoreGive(queueMutex);
  return n;
}
