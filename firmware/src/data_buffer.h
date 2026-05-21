#ifndef DATA_BUFFER_H
#define DATA_BUFFER_H

#include <Arduino.h>
#include <Preferences.h>

#define BUFFER_MAX_SIZE 100
#define BUFFER_NAMESPACE "databuffer"

// Recovery: als we boven deze drempel zitten of als NVS zelf bijna vol staat,
// veegt init() de queue. Voorkomt heap-fragmentatie + WiFi-stack panic bij de
// HTTPS-bursts die anders elke boot opnieuw 30+ readings willen uploaden.
#define BUFFER_RECOVERY_THRESHOLD 30
#define BUFFER_NVS_FREE_MIN       30

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
