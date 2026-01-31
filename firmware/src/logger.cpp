#include "logger.h"

Logger::Logger() : level(LOG_INFO), serialEnabled(true) {
}

void Logger::setLevel(LogLevel level) {
  this->level = level;
}

void Logger::enableSerial(bool enable) {
  serialEnabled = enable;
}

String Logger::getLevelString(LogLevel level) {
  switch (level) {
    case LOG_DEBUG: return "DEBUG";
    case LOG_INFO: return "INFO";
    case LOG_WARN: return "WARN";
    case LOG_ERROR: return "ERROR";
    default: return "UNKNOWN";
  }
}

void Logger::printLog(LogLevel logLevel, String message) {
  if (logLevel < level) {
    return;
  }
  
  if (serialEnabled) {
    unsigned long timestamp = millis();
    String levelStr = getLevelString(logLevel);
    
    Serial.print("[");
    Serial.print(timestamp);
    Serial.print("] [");
    Serial.print(levelStr);
    Serial.print("] ");
    Serial.println(message);
  }
}

void Logger::debug(String message) {
  printLog(LOG_DEBUG, message);
}

void Logger::info(String message) {
  printLog(LOG_INFO, message);
}

void Logger::warn(String message) {
  printLog(LOG_WARN, message);
}

void Logger::error(String message) {
  printLog(LOG_ERROR, message);
}

void Logger::debug(String tag, String message) {
  debug("[" + tag + "] " + message);
}

void Logger::info(String tag, String message) {
  info("[" + tag + "] " + message);
}

void Logger::warn(String tag, String message) {
  warn("[" + tag + "] " + message);
}

void Logger::error(String tag, String message) {
  error("[" + tag + "] " + message);
}
