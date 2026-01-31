#ifndef DATA_BUFFER_H
#define DATA_BUFFER_H

#include <Arduino.h>
#include <Preferences.h>

#define BUFFER_MAX_SIZE 100
#define BUFFER_NAMESPACE "databuffer"

class DataBuffer {
private:
  Preferences preferences;
  int count;
  int head;
  int tail;
  
  String getKey(int index);
  
public:
  DataBuffer();
  ~DataBuffer();
  
  bool init();
  bool add(String data);
  String get(int index);
  bool remove(int count);
  int getCount();
  void clear();
  bool isFull();
  bool isEmpty();
};

#endif
