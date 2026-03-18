/**
 * Centrale definitie van alle ondersteunde RS485 regelaartypes.
 * Per type: protocol, standaard baudrate/slave-adres, beschikbare commando's.
 */

export type ControllerProtocol = 'CAREL_PJEZ' | 'MODBUS_RTU';

export type CommandCategory = 'READ' | 'SET' | 'ACTION';

export interface ControllerCommand {
  id: string;
  name: string;
  description: string;
  category: CommandCategory;
  /** Of er een invoerwaarde nodig is */
  hasInput: boolean;
  /** Min waarde (voor numerieke input) */
  min?: number;
  /** Max waarde (voor numerieke input) */
  max?: number;
  /** Stap (voor slider) */
  step?: number;
  /** Eenheid (bijv. "°C", "uur", "min") */
  unit?: string;
  /** Gevaarlijk = alleen zichtbaar voor technici */
  dangerous?: boolean;
  /** Vereist bevestiging in dialoog */
  requiresConfirmation?: boolean;
}

export interface ControllerType {
  id: string;
  name: string;
  description: string;
  protocol: ControllerProtocol;
  defaultBaudRate: number;
  defaultSlaveAddr: number;
  commands: ControllerCommand[];
}

export const CONTROLLER_TYPES: ControllerType[] = [
  {
    id: 'CAREL_PJEZ_EASY_COOL',
    name: 'Carel PJEZ Easy Cool',
    description: 'Carel supervisieprotocol (1200 8N2)',
    protocol: 'CAREL_PJEZ',
    defaultBaudRate: 1200,
    defaultSlaveAddr: 1,
    commands: [
      { id: 'READ_TEMPERATURE', name: 'Temperatuur lezen', description: 'Lees actuele temperatuur van regelaar', category: 'READ', hasInput: false },
      { id: 'READ_DEFROST_PARAMS', name: 'Defrost parameters lezen', description: 'Lees type, interval en duur', category: 'READ', hasInput: false },
      { id: 'DEFROST_START', name: 'Defrost starten', description: 'Start handmatige ontdooiing', category: 'ACTION', hasInput: false, requiresConfirmation: true },
      { id: 'DEFROST_STOP', name: 'Defrost stoppen', description: 'Stop handmatige ontdooiing', category: 'ACTION', hasInput: false, requiresConfirmation: true },
      { id: 'SET_DEFROST_INTERVAL', name: 'Defrost interval', description: 'Interval tussen ontdooiingen (uur)', category: 'SET', hasInput: true, min: 0, max: 199, step: 1, unit: 'uur', requiresConfirmation: true },
      { id: 'SET_DEFROST_DURATION', name: 'Defrost duur', description: 'Maximale ontdooiingsduur (min)', category: 'SET', hasInput: true, min: 1, max: 199, step: 1, unit: 'min', requiresConfirmation: true },
      { id: 'SET_DEFROST_TYPE', name: 'Defrost type', description: 'Type ontdooiing (0-4)', category: 'SET', hasInput: true, min: 0, max: 4, step: 1, unit: '', requiresConfirmation: true },
    ],
  },
  {
    id: 'CAREL_IR33_MODBUS',
    name: 'Carel IR33 (Modbus)',
    description: 'Carel IR33 via Modbus RTU',
    protocol: 'MODBUS_RTU',
    defaultBaudRate: 9600,
    defaultSlaveAddr: 1,
    commands: [
      { id: 'READ_TEMPERATURE', name: 'Temperatuur lezen', description: 'Lees actuele temperatuur van regelaar', category: 'READ', hasInput: false },
      { id: 'READ_SETPOINT', name: 'Setpoint lezen', description: 'Lees ingestelde temperatuur', category: 'READ', hasInput: false },
      { id: 'READ_ALARM_STATUS', name: 'Alarmstatus lezen', description: 'Lees actieve alarmen', category: 'READ', hasInput: false },
      { id: 'SET_SETPOINT', name: 'Setpoint instellen', description: 'Stel ingestelde temperatuur in (°C)', category: 'SET', hasInput: true, min: -50, max: 50, step: 0.5, unit: '°C', requiresConfirmation: true },
      { id: 'ALARM_RESET', name: 'Alarm resetten', description: 'Reset actieve alarmen', category: 'ACTION', hasInput: false, requiresConfirmation: true },
      { id: 'DEFROST_START', name: 'Defrost starten', description: 'Start handmatige ontdooiing', category: 'ACTION', hasInput: false, requiresConfirmation: true },
      { id: 'POWER_ON_OFF', name: 'Aan/uit schakelen', description: 'Schakel regelaar aan of uit', category: 'ACTION', hasInput: true, min: 0, max: 1, step: 1, unit: '0=uit, 1=aan', dangerous: true, requiresConfirmation: true },
      { id: 'SET_DEFROST_INTERVAL', name: 'Defrost interval', description: 'Interval (uur)', category: 'SET', hasInput: true, min: 0, max: 199, step: 1, unit: 'uur', requiresConfirmation: true },
      { id: 'SET_DEFROST_DURATION', name: 'Defrost duur', description: 'Max duur (min)', category: 'SET', hasInput: true, min: 1, max: 199, step: 1, unit: 'min', requiresConfirmation: true },
    ],
  },
  {
    id: 'DIXELL_XR60C',
    name: 'Dixell XR60C',
    description: 'Dixell XR60C via Modbus RTU',
    protocol: 'MODBUS_RTU',
    defaultBaudRate: 9600,
    defaultSlaveAddr: 1,
    commands: [
      { id: 'READ_TEMPERATURE', name: 'Temperatuur lezen', description: 'Lees actuele temperatuur', category: 'READ', hasInput: false },
      { id: 'READ_SETPOINT', name: 'Setpoint lezen', description: 'Lees ingestelde temperatuur', category: 'READ', hasInput: false },
      { id: 'READ_ALARM_STATUS', name: 'Alarmstatus lezen', description: 'Lees actieve alarmen', category: 'READ', hasInput: false },
      { id: 'SET_SETPOINT', name: 'Setpoint instellen', description: 'Stel ingestelde temperatuur in (°C)', category: 'SET', hasInput: true, min: -50, max: 50, step: 0.5, unit: '°C', requiresConfirmation: true },
      { id: 'ALARM_RESET', name: 'Alarm resetten', description: 'Reset actieve alarmen', category: 'ACTION', hasInput: false, requiresConfirmation: true },
      { id: 'DEFROST_START', name: 'Defrost starten', description: 'Start handmatige ontdooiing', category: 'ACTION', hasInput: false, requiresConfirmation: true },
    ],
  },
  {
    id: 'DIXELL_XR70C',
    name: 'Dixell XR70C',
    description: 'Dixell XR70C via Modbus RTU',
    protocol: 'MODBUS_RTU',
    defaultBaudRate: 9600,
    defaultSlaveAddr: 1,
    commands: [
      { id: 'READ_TEMPERATURE', name: 'Temperatuur lezen', description: 'Lees actuele temperatuur', category: 'READ', hasInput: false },
      { id: 'READ_SETPOINT', name: 'Setpoint lezen', description: 'Lees ingestelde temperatuur', category: 'READ', hasInput: false },
      { id: 'READ_ALARM_STATUS', name: 'Alarmstatus lezen', description: 'Lees actieve alarmen', category: 'READ', hasInput: false },
      { id: 'SET_SETPOINT', name: 'Setpoint instellen', description: 'Stel ingestelde temperatuur in (°C)', category: 'SET', hasInput: true, min: -50, max: 50, step: 0.5, unit: '°C', requiresConfirmation: true },
      { id: 'ALARM_RESET', name: 'Alarm resetten', description: 'Reset actieve alarmen', category: 'ACTION', hasInput: false, requiresConfirmation: true },
      { id: 'DEFROST_START', name: 'Defrost starten', description: 'Start handmatige ontdooiing', category: 'ACTION', hasInput: false, requiresConfirmation: true },
    ],
  },
  {
    id: 'ELIWELL_IC900',
    name: 'Eliwell IC900',
    description: 'Eliwell IC900 via Modbus RTU',
    protocol: 'MODBUS_RTU',
    defaultBaudRate: 9600,
    defaultSlaveAddr: 1,
    commands: [
      { id: 'READ_TEMPERATURE', name: 'Temperatuur lezen', description: 'Lees actuele temperatuur', category: 'READ', hasInput: false },
      { id: 'READ_SETPOINT', name: 'Setpoint lezen', description: 'Lees ingestelde temperatuur', category: 'READ', hasInput: false },
      { id: 'SET_SETPOINT', name: 'Setpoint instellen', description: 'Stel ingestelde temperatuur in (°C)', category: 'SET', hasInput: true, min: -50, max: 50, step: 0.5, unit: '°C', requiresConfirmation: true },
      { id: 'ALARM_RESET', name: 'Alarm resetten', description: 'Reset actieve alarmen', category: 'ACTION', hasInput: false, requiresConfirmation: true },
      { id: 'DEFROST_START', name: 'Defrost starten', description: 'Start handmatige ontdooiing', category: 'ACTION', hasInput: false, requiresConfirmation: true },
    ],
  },
  {
    id: 'ELIWELL_EWPC',
    name: 'Eliwell EWPC',
    description: 'Eliwell EWPC via Modbus RTU',
    protocol: 'MODBUS_RTU',
    defaultBaudRate: 9600,
    defaultSlaveAddr: 1,
    commands: [
      { id: 'READ_TEMPERATURE', name: 'Temperatuur lezen', description: 'Lees actuele temperatuur', category: 'READ', hasInput: false },
      { id: 'READ_SETPOINT', name: 'Setpoint lezen', description: 'Lees ingestelde temperatuur', category: 'READ', hasInput: false },
      { id: 'SET_SETPOINT', name: 'Setpoint instellen', description: 'Stel ingestelde temperatuur in (°C)', category: 'SET', hasInput: true, min: -50, max: 50, step: 0.5, unit: '°C', requiresConfirmation: true },
      { id: 'ALARM_RESET', name: 'Alarm resetten', description: 'Reset actieve alarmen', category: 'ACTION', hasInput: false, requiresConfirmation: true },
      { id: 'DEFROST_START', name: 'Defrost starten', description: 'Start handmatige ontdooiing', category: 'ACTION', hasInput: false, requiresConfirmation: true },
    ],
  },
  {
    id: 'MODBUS_GENERIC',
    name: 'Generieke Modbus',
    description: 'Handmatig register / coil lezen of schrijven',
    protocol: 'MODBUS_RTU',
    defaultBaudRate: 9600,
    defaultSlaveAddr: 1,
    commands: [
      { id: 'READ_REGISTER', name: 'Register lezen', description: 'Lees holding register (adres 0-65535)', category: 'READ', hasInput: true, min: 0, max: 65535, step: 1, unit: 'adres' },
      { id: 'WRITE_REGISTER', name: 'Register schrijven', description: 'Schrijf holding register (adres + waarde)', category: 'SET', hasInput: true, min: 0, max: 65535, step: 1, unit: 'adres', dangerous: true, requiresConfirmation: true },
      { id: 'READ_COIL', name: 'Coil lezen', description: 'Lees coil (adres 0-65535)', category: 'READ', hasInput: true, min: 0, max: 65535, step: 1, unit: 'adres' },
      { id: 'WRITE_COIL', name: 'Coil schrijven', description: 'Schrijf coil (adres + 0/1)', category: 'SET', hasInput: true, min: 0, max: 65535, step: 1, unit: 'adres', dangerous: true, requiresConfirmation: true },
    ],
  },
];

export function getControllerTypeById(id: string): ControllerType | undefined {
  return CONTROLLER_TYPES.find((t) => t.id === id);
}

export function getCommandsForDevice(controllerTypeId: string | null, isTechnician: boolean): ControllerCommand[] {
  if (!controllerTypeId) return [];
  const type = getControllerTypeById(controllerTypeId);
  if (!type) return [];
  return type.commands.filter((c) => !c.dangerous || isTechnician);
}
