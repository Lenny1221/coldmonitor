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
  
  void configure(String password);   // callbacks + wachtwoord, zonder ArduinoOTA.begin()
  bool beginWhenReady();             // begin() pas als WiFi connected (kan false)
  bool init(String password);        // configure + beginWhenReady
  bool tryDeferredInit();            // Retry begin when WiFi connects
  void handle();
  void setHostname(String hostname);
};

#endif
