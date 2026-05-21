#include "logger.h"
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

namespace {
SemaphoreHandle_t s_logMutex = nullptr;
}

Logger::Logger() : level(LOG_INFO), serialEnabled(true) {
  if (!s_logMutex) {
    s_logMutex = xSemaphoreCreateMutex();
  }
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
  if (!serialEnabled) {
    return;
  }
  if (s_logMutex && xSemaphoreTake(s_logMutex, pdMS_TO_TICKS(200)) != pdTRUE) {
    return;
  }
  unsigned long timestamp = millis();
  String levelStr = getLevelString(logLevel);
  char tsBuf[14];
  snprintf(tsBuf, sizeof(tsBuf), "[%08lu]", timestamp);
  Serial.print(tsBuf);
  Serial.print(" [");
  Serial.print(levelStr);
  Serial.print("] ");
  Serial.println(message);
  if (s_logMutex) {
    xSemaphoreGive(s_logMutex);
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
