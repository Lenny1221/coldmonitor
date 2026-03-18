import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { devicesApi, getErrorMessage } from '../services/api';
import { format, parseISO } from 'date-fns';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ControllerType {
  id: string;
  name: string;
  description: string;
  protocol: string;
  defaultBaudRate: number;
  defaultSlaveAddr: number;
}

interface ControllerCommand {
  id: string;
  name: string;
  description: string;
  category: string;
  hasInput: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  dangerous?: boolean;
  requiresConfirmation?: boolean;
}

interface RS485Status {
  rs485Temperature: number | null;
  defrostType: number | null;
  defrostInterval: number | null;
  defrostDuration: number | null;
  deviceOnline: boolean;
  lastUpdate: string | null;
  controllerConfig?: {
    controllerType: string | null;
    controllerSlaveAddr: number | null;
    controllerBaudRate: number | null;
    deviceId: string;
  };
}

interface ControllerConfigResponse {
  controllerType: string | null;
  controllerSlaveAddr: number | null;
  controllerBaudRate: number | null;
  typeInfo: ControllerType | null;
  commands: ControllerCommand[];
}

interface DeviceCommand {
  id: string;
  commandType: string;
  status: string;
  parameters?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  executedAt?: string | null;
}

interface RegelaarCommandoPaneelProps {
  coldCellId: string;
  coldCellName: string;
  devices: Array<{ id: string; serialNumber: string; status: string }>;
  rs485Status: RS485Status | null;
  onRefreshRS485: () => void;
}

const RegelaarCommandoPaneel: React.FC<RegelaarCommandoPaneelProps> = ({
  coldCellId: _coldCellId,
  coldCellName: _coldCellName,
  devices,
  rs485Status,
  onRefreshRS485,
}) => {
  const { user } = useAuth();
  const isTechnician = user?.role === 'TECHNICIAN' || user?.role === 'ADMIN';

  const device = devices.find((d) => d.status === 'ONLINE') || devices[0];
  const deviceOnline = rs485Status?.deviceOnline ?? false;

  const [controllerTypes, setControllerTypes] = useState<ControllerType[]>([]);
  const [controllerConfig, setControllerConfig] = useState<ControllerConfigResponse | null>(null);
  const [commandHistory, setCommandHistory] = useState<DeviceCommand[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [sendingCommand, setSendingCommand] = useState<string | null>(null);
  const [pollingCommandId, setPollingCommandId] = useState<string | null>(null);

  // Sectie 1: Regelaar instellen
  const [editControllerType, setEditControllerType] = useState('');
  const [editSlaveAddr, setEditSlaveAddr] = useState(1);
  const [editBaudRate, setEditBaudRate] = useState(9600);

  // Sectie 3: Commando input
  const [commandInputs, setCommandInputs] = useState<Record<string, number>>({});
  const [confirmCommand, setConfirmCommand] = useState<{
    cmd: ControllerCommand;
    inputValue?: number;
  } | null>(null);

  useEffect(() => {
    devicesApi.getControllerTypes().then((r) => {
      setControllerTypes(r.controllerTypes || []);
    }).catch(() => setControllerTypes([]));
  }, []);

  useEffect(() => {
    if (!device?.id) return;
    setLoadingConfig(true);
    devicesApi
      .getControllerConfig(device.id)
      .then((r) => {
        setControllerConfig(r);
        setEditControllerType(r.controllerType || '');
        setEditSlaveAddr(r.controllerSlaveAddr ?? r.typeInfo?.defaultSlaveAddr ?? 1);
        setEditBaudRate(r.controllerBaudRate ?? r.typeInfo?.defaultBaudRate ?? 9600);
      })
      .catch(() => setControllerConfig(null))
      .finally(() => setLoadingConfig(false));
  }, [device?.id]);

  useEffect(() => {
    if (!device?.id || !historyExpanded) return;
    setLoadingHistory(true);
    devicesApi
      .getCommandHistory(device.id)
      .then((r) => setCommandHistory(r.commands || []))
      .catch(() => setCommandHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [device?.id, historyExpanded]);

  const handleSaveControllerConfig = async () => {
    if (!device?.id) return;
    setSavingConfig(true);
    try {
      await devicesApi.updateControllerConfig(device.id, {
        controllerType: editControllerType || undefined,
        controllerSlaveAddr: editSlaveAddr,
        controllerBaudRate: editBaudRate,
      });
      const r = await devicesApi.getControllerConfig(device.id);
      setControllerConfig(r);
      onRefreshRS485();
    } catch (e) {
      alert('Fout: ' + getErrorMessage(e, 'Kon configuratie niet opslaan'));
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSendCommand = async (cmd: ControllerCommand, inputValue?: number) => {
    if (!device?.id) return;
    setConfirmCommand(null);
    setSendingCommand(cmd.id);

    const parameters: Record<string, unknown> = {};
    if (cmd.hasInput && inputValue !== undefined) {
      if (cmd.id === 'SET_SETPOINT') parameters.value = inputValue;
      else if (cmd.id === 'SET_DEFROST_INTERVAL') parameters.hours = inputValue;
      else if (cmd.id === 'SET_DEFROST_DURATION') parameters.minutes = inputValue;
      else if (cmd.id === 'SET_DEFROST_TYPE') parameters.type = inputValue;
      else if (cmd.id === 'POWER_ON_OFF') parameters.value = inputValue;
      else if (cmd.id === 'READ_REGISTER' || cmd.id === 'READ_COIL') parameters.address = inputValue;
      else if (cmd.id === 'WRITE_REGISTER' || cmd.id === 'WRITE_COIL') {
        parameters.address = inputValue;
        parameters.value = inputValue; // Voor write: tweede waarde via extra UI later
      }
    }

    try {
      const created = await devicesApi.sendCommand(device.id, cmd.id, Object.keys(parameters).length ? parameters : undefined);
      setPollingCommandId(created.id);
      onRefreshRS485();
    } catch (e) {
      alert('Fout: ' + getErrorMessage(e, 'Kon commando niet versturen'));
      setSendingCommand(null);
    }
  };

  // Poll voor commandoresultaat
  useEffect(() => {
    if (!pollingCommandId || !device?.id) return;
    const interval = setInterval(async () => {
      try {
        const { commands } = await devicesApi.getCommandHistory(device.id);
        const c = commands.find((x: DeviceCommand) => x.id === pollingCommandId);
        if (c && ['COMPLETED', 'FAILED'].includes(c.status)) {
          setPollingCommandId(null);
          setSendingCommand(null);
          setCommandHistory((prev) => {
            const updated = [c, ...prev.filter((x) => x.id !== c.id)].slice(0, 20);
            return updated;
          });
          onRefreshRS485();
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pollingCommandId, device?.id]);

  const lastUpdate = rs485Status?.lastUpdate;
  const lastUpdateDate = lastUpdate ? new Date(lastUpdate) : null;
  const minutesAgo = lastUpdateDate ? (Date.now() - lastUpdateDate.getTime()) / 60000 : null;
  const statusColor =
    minutesAgo == null
      ? 'text-gray-500'
      : minutesAgo < 2
        ? 'text-green-600 dark:text-green-400'
        : minutesAgo < 10
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-red-600 dark:text-red-400';

  const readCommands = controllerConfig?.commands.filter((c) => c.category === 'READ') ?? [];
  const setCommands = controllerConfig?.commands.filter((c) => c.category === 'SET') ?? [];
  const actionCommands = controllerConfig?.commands.filter((c) => c.category === 'ACTION') ?? [];

  return (
    <div className="space-y-6">
      {/* Sectie 1: Regelaar instellen (technici) */}
      {isTechnician && (
        <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-frost-100 mb-3">Regelaar instellen</h3>
          <p className="text-xs text-amber-800 dark:text-amber-200 mb-4">
            Na wijziging moet de firmware opnieuw geconfigureerd worden (device herstart of configuratieportal).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">Regelaartype</label>
              <select
                value={editControllerType}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditControllerType(v);
                  const t = controllerTypes.find((x) => x.id === v);
                  if (t) {
                    setEditSlaveAddr(t.defaultSlaveAddr);
                    setEditBaudRate(t.defaultBaudRate);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] rounded-lg bg-white dark:bg-frost-850 text-gray-900 dark:text-frost-100 text-sm"
              >
                <option value="">— Geen / niet ingesteld —</option>
                {controllerTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">Slave-adres</label>
              <input
                type="number"
                min={1}
                max={247}
                value={editSlaveAddr}
                onChange={(e) => setEditSlaveAddr(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] rounded-lg bg-white dark:bg-frost-850 text-gray-900 dark:text-frost-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">Baudrate</label>
              <input
                type="number"
                min={300}
                max={115200}
                value={editBaudRate}
                onChange={(e) => setEditBaudRate(parseInt(e.target.value, 10) || 9600)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[rgba(100,200,255,0.15)] rounded-lg bg-white dark:bg-frost-850 text-gray-900 dark:text-frost-100 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleSaveControllerConfig}
            disabled={savingConfig}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {savingConfig ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      )}

      {/* Sectie 2: Live status */}
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-frost-850">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-frost-100 mb-3">Live status</h3>
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <div>
            <span className="text-xs text-gray-500 dark:text-slate-400">RS485 Temperatuur</span>
            <div className="text-lg font-semibold text-gray-900 dark:text-frost-100">
              {rs485Status?.rs485Temperature != null
                ? `${rs485Status.rs485Temperature.toFixed(1)} °C`
                : '—'}
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-slate-400">Setpoint</span>
            <div className="text-lg font-semibold text-gray-900 dark:text-frost-100">—</div>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-slate-400">Defrost type</span>
            <div className="text-sm font-medium text-gray-900 dark:text-frost-100">
              {rs485Status?.defrostType != null ? rs485Status.defrostType : '—'}
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-slate-400">Interval / duur</span>
            <div className="text-sm font-medium text-gray-900 dark:text-frost-100">
              {rs485Status?.defrostInterval != null && rs485Status?.defrostDuration != null
                ? `${rs485Status.defrostInterval}u / ${rs485Status.defrostDuration}min`
                : '—'}
            </div>
          </div>
          <div className="flex-1" />
          <button
            onClick={onRefreshRS485}
            disabled={!deviceOnline}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-200 dark:bg-frost-850 text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-[rgba(0,150,255,0.12)] disabled:opacity-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Vernieuw
          </button>
        </div>
        <div className={`text-xs ${statusColor}`}>
          {lastUpdate ? (
            <>
              Laatste update: {format(parseISO(lastUpdate), 'dd/MM HH:mm')}
              {deviceOnline ? (
                <span className="ml-2 text-green-600 dark:text-green-400">· Device online</span>
              ) : (
                <span className="ml-2 text-red-600 dark:text-red-400">· Device offline</span>
              )}
            </>
          ) : (
            'Geen data'
          )}
        </div>
      </div>

      {/* Sectie 3: Commando's */}
      <div className="p-4 rounded-lg border border-gray-200 dark:border-[rgba(100,200,255,0.12)]">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-frost-100 mb-4">Commando's</h3>
        {loadingConfig ? (
          <p className="text-sm text-gray-500">Laden...</p>
        ) : !controllerConfig?.controllerType ? (
          <p className="text-sm text-gray-500">
            Geen regelaartype ingesteld. {isTechnician && 'Stel hierboven een regelaartype in.'}
          </p>
        ) : (
          <div className="space-y-6">
            {[
              { title: 'Lezen', commands: readCommands },
              { title: 'Instellen', commands: setCommands },
              { title: 'Acties', commands: actionCommands },
            ].map(
              (group) =>
                group.commands.length > 0 && (
                  <div key={group.title}>
                    <h4 className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                      {group.title}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {group.commands.map((cmd) => {
                        const isDisabled = !deviceOnline || sendingCommand !== null;
                        const inputVal = commandInputs[cmd.id] ?? (cmd.min ?? 0);
                        return (
                          <div key={cmd.id} className="flex items-center gap-2">
                            {cmd.hasInput ? (
                              <>
                                <input
                                  type="number"
                                  min={cmd.min}
                                  max={cmd.max}
                                  step={cmd.step ?? 1}
                                  value={inputVal}
                                  onChange={(e) =>
                                    setCommandInputs((p) => ({
                                      ...p,
                                      [cmd.id]: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                  className="w-20 px-2 py-1 border rounded text-sm"
                                />
                                {cmd.unit && <span className="text-xs text-gray-500">{cmd.unit}</span>}
                              </>
                            ) : null}
                            <button
                              onClick={() => {
                                if (cmd.requiresConfirmation) {
                                  setConfirmCommand({
                                    cmd,
                                    inputValue: cmd.hasInput ? (commandInputs[cmd.id] ?? cmd.min ?? 0) : undefined,
                                  });
                                } else {
                                  handleSendCommand(
                                    cmd,
                                    cmd.hasInput ? (commandInputs[cmd.id] ?? cmd.min ?? 0) : undefined
                                  );
                                }
                              }}
                              disabled={isDisabled}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                                cmd.dangerous
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              } hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {sendingCommand === cmd.id ? 'Bezig...' : cmd.name}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
            )}
          </div>
        )}
        {pollingCommandId && (
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            Wachten op resultaat...
          </div>
        )}
      </div>

      {/* Bevestigingsdialoog */}
      {confirmCommand && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setConfirmCommand(null)}
        >
          <div
            className="bg-white dark:bg-frost-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-[rgba(100,200,255,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-frost-100 mb-2">
              {confirmCommand.cmd.name} bevestigen
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">{confirmCommand.cmd.description}</p>
            {confirmCommand.inputValue !== undefined && (
              <p className="text-sm text-gray-700 dark:text-slate-200 mb-4">
                Waarde: {confirmCommand.inputValue} {confirmCommand.cmd.unit}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmCommand(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-frost-850 text-gray-700 dark:text-slate-200"
              >
                Annuleren
              </button>
              <button
                onClick={() =>
                  handleSendCommand(confirmCommand.cmd, confirmCommand.inputValue)
                }
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Uitvoeren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sectie 4: Commandohistoriek */}
      <div className="border border-gray-200 dark:border-[rgba(100,200,255,0.12)] rounded-lg overflow-hidden">
        <button
          onClick={() => setHistoryExpanded(!historyExpanded)}
          className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 dark:text-frost-100 hover:bg-gray-50 dark:hover:bg-frost-850 transition-colors"
        >
          Commandohistoriek
          {historyExpanded ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
        {historyExpanded && (
          <div className="border-t border-gray-200 dark:border-[rgba(100,200,255,0.12)] p-4">
            {loadingHistory ? (
              <p className="text-sm text-gray-500">Laden...</p>
            ) : commandHistory.length === 0 ? (
              <p className="text-sm text-gray-500">Geen commando's uitgevoerd.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-slate-400 uppercase">
                      <th className="pb-2 pr-4">Tijdstip</th>
                      <th className="pb-2 pr-4">Commando</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2">Resultaat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[rgba(100,200,255,0.08)]">
                    {commandHistory.map((c) => (
                      <tr key={c.id} className="text-gray-700 dark:text-slate-200">
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {format(parseISO(c.createdAt), 'dd/MM HH:mm')}
                        </td>
                        <td className="py-2 pr-4">{c.commandType}</td>
                        <td className="py-2 pr-4">
                          {c.status === 'COMPLETED' ? (
                            <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                              <CheckCircleIcon className="h-4 w-4" /> OK
                            </span>
                          ) : c.status === 'FAILED' ? (
                            <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-4 w-4" /> Mislukt
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" /> {c.status}
                            </span>
                          )}
                        </td>
                        <td className="py-2">
                          {c.error
                            ? c.error
                            : c.result && typeof c.result === 'object'
                              ? JSON.stringify(c.result).slice(0, 80)
                              : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegelaarCommandoPaneel;
