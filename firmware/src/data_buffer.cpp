#include "data_buffer.h"
#include "logger.h"

extern Logger logger;

DataBuffer::DataBuffer() : count(0), head(0), tail(0) {
}

DataBuffer::~DataBuffer() {
  preferences.end();
}

bool DataBuffer::init() {
  preferences.begin(BUFFER_NAMESPACE, false);
  
  // Load count from preferences
  count = preferences.getInt("count", 0);
  head = preferences.getInt("head", 0);
  tail = preferences.getInt("tail", 0);
  
  // Validate count
  if (count < 0 || count > BUFFER_MAX_SIZE) {
    count = 0;
    head = 0;
    tail = 0;
    preferences.putInt("count", 0);
    preferences.putInt("head", 0);
    preferences.putInt("tail", 0);
  }
  
  logger.info("Data buffer initialized: " + String(count) + " items");
  return true;
}

String DataBuffer::getKey(int index) {
  return "item" + String(index);
}

bool DataBuffer::add(String data) {
  if (isFull()) {
    logger.warn("Data buffer is full!");
    return false;
  }
  
  // Store data
  String key = getKey(tail);
  if (preferences.putString(key.c_str(), data)) {
    tail = (tail + 1) % BUFFER_MAX_SIZE;
    count++;
    
    preferences.putInt("count", count);
    preferences.putInt("tail", tail);
    
    return true;
  }
  
  return false;
}

String DataBuffer::get(int index) {
  if (index < 0 || index >= count) {
    return "";
  }
  
  int actualIndex = (head + index) % BUFFER_MAX_SIZE;
  String key = getKey(actualIndex);
  return preferences.getString(key.c_str(), "");
}

bool DataBuffer::remove(int numItems) {
  if (numItems <= 0 || numItems > count) {
    return false;
  }
  
  // Remove items by clearing keys and updating head
  for (int i = 0; i < numItems; i++) {
    String key = getKey(head);
    preferences.remove(key.c_str());
    head = (head + 1) % BUFFER_MAX_SIZE;
  }
  
  count -= numItems;
  
  preferences.putInt("count", count);
  preferences.putInt("head", head);
  
  return true;
}

int DataBuffer::getCount() {
  return count;
}

void DataBuffer::clear() {
  // Clear all items
  for (int i = 0; i < BUFFER_MAX_SIZE; i++) {
    String key = getKey(i);
    preferences.remove(key.c_str());
  }
  
  count = 0;
  head = 0;
  tail = 0;
  
  preferences.putInt("count", 0);
  preferences.putInt("head", 0);
  preferences.putInt("tail", 0);
  
  logger.info("Data buffer cleared");
}

bool DataBuffer::isFull() {
  return count >= BUFFER_MAX_SIZE;
}

bool DataBuffer::isEmpty() {
  return count == 0;
}
