#ifndef LOGGER_H
#define LOGGER_H

#include <Arduino.h>

enum LogLevel {
  LOG_DEBUG = 0,
  LOG_INFO = 1,
  LOG_WARN = 2,
  LOG_ERROR = 3
};

class Logger {
private:
  LogLevel level;
  bool serialEnabled;
  
  void printLog(LogLevel level, String message);
  String getLevelString(LogLevel level);
  
public:
  Logger();
  
  void setLevel(LogLevel level);
  void enableSerial(bool enable);
  
  void debug(String message);
  void info(String message);
  void warn(String message);
  void error(String message);
  
  void debug(String tag, String message);
  void info(String tag, String message);
  void warn(String tag, String message);
  void error(String tag, String message);
};

#endif
