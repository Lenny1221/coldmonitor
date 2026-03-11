#ifndef DOOR_EVENTS_H
#define DOOR_EVENTS_H

#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

#define DOOR_DEBOUNCE_MS 30
#define DOOR_EVENT_QUEUE_SIZE 32
#define DOOR_MAX_EVENTS_PER_SECOND 5

struct DoorEvent {
  bool isOpen;           // true = OPEN, false = CLOSED
  uint64_t timestamp;    // Unix ms (UTC) if NTP synced; else millis() – backend detecteert fallback
  uint32_t seq;
  int rssi;
  unsigned long uptimeMs;
};

class DoorEventManager {
public:
  DoorEventManager();
  
  // Sync met huidige hardware-state bij boot (voorkomt spurious event)
  void setInitialState(bool currentDoorOpen);
  
  // Debounced read: returns true if state changed (after debounce)
  bool poll(bool currentDoorOpen);
  
  // Queue event for offline flush (when WiFi down)
  void enqueue(const DoorEvent& ev);
  
  // Get next event from queue (FIFO), returns false if empty
  bool dequeue(DoorEvent& out);
  
  // Dequeue multiple events into array, max N. Returns count.
  int dequeueMany(DoorEvent* out, int maxCount);
  
  bool hasPending();
  int getQueueCount();
  
  uint32_t getNextSeq() { return ++seqCounter; }
  uint32_t getSeq() const { return seqCounter; }

private:
  SemaphoreHandle_t queueMutex;
  unsigned long lastStableTime;
  bool lastStableState;
  bool lastReportedState;
  
  DoorEvent queue[DOOR_EVENT_QUEUE_SIZE];
  int queueHead;
  int queueTail;
  int queueCount;
  
  uint32_t seqCounter;
  unsigned long lastEventMs;
  int eventsThisSecond;
};

#endif
