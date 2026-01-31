#ifndef POWER_MANAGER_H
#define POWER_MANAGER_H

#include <Arduino.h>

class PowerManager {
private:
  bool initialized;
  
public:
  PowerManager();
  ~PowerManager();
  
  bool init();
  void enterDeepSleep(unsigned long seconds);
  void lightSleep(unsigned long milliseconds);
  void setCPUFrequency(uint8_t frequency);
  void enableWiFiPowerSave(bool enable);
};

#endif
