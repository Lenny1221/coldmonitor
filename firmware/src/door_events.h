#ifndef DOOR_EVENTS_H
#define DOOR_EVENTS_H

#include <Arduino.h>

#define DOOR_DEBOUNCE_MS 50
#define DOOR_EVENT_QUEUE_SIZE 32
#define DOOR_MAX_EVENTS_PER_SECOND 5

struct DoorEvent {
  bool isOpen;           // true = OPEN, false = CLOSED
  unsigned long timestamp;
  uint32_t seq;
  int rssi;
  unsigned long uptimeMs;
};

class DoorEventManager {
public:
  DoorEventManager();
  
  // Debounced read: returns true if state changed (after debounce)
  bool poll(bool currentDoorOpen);
  
  // Queue event for offline flush (when WiFi down)
  void enqueue(const DoorEvent& ev);
  
  // Get next event from queue (FIFO), returns false if empty
  bool dequeue(DoorEvent& out);
  
  // Dequeue multiple events into array, max N. Returns count.
  int dequeueMany(DoorEvent* out, int maxCount);
  
  bool hasPending() const { return queueCount > 0; }
  int getQueueCount() const { return queueCount; }
  
  uint32_t getNextSeq() { return ++seqCounter; }
  uint32_t getSeq() const { return seqCounter; }

private:
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
