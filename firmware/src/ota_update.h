#ifndef OTA_UPDATE_H
#define OTA_UPDATE_H

#include <Arduino.h>
#include <ArduinoOTA.h>

class OTAUpdate {
private:
  bool initialized;
  String password;
  
public:
  OTAUpdate();
  ~OTAUpdate();
  
  bool init(String password);
  bool tryDeferredInit();  // Retry init when WiFi connects (gebruikt opgeslagen password)
  void handle();
  void setHostname(String hostname);
};

#endif
