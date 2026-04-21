#ifndef DOOR_CONTACT_H
#define DOOR_CONTACT_H

#include <Arduino.h>

/**
 * Debounced wrapper rond de reed-switch op de carrier (PIN_REED_SWITCH).
 * 50 ms software-debounce bovenop de RC-filter op het bord.
 *
 * Logt alleen toestandswisselingen, niet elke poll.
 */

void     initDoor();
bool     isDoorOpen();          // huidige gedebounced status
void     updateDoor();          // roep in loop aan
uint32_t doorOpenDurationMs();  // 0 als dicht, anders ms sinds openen

#endif /* DOOR_CONTACT_H */
