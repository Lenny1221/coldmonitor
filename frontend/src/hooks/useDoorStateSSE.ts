import { useEffect, useState, useRef, useCallback } from 'react';
import Cookies from 'js-cookie';
import { coldCellStateApi } from '../services/api';

export interface DoorState {
  doorState: 'OPEN' | 'CLOSED' | null;
  doorLastChangedAt: string | null;
  doorOpenCountTotal: number;
  doorCloseCountTotal: number;
  doorStatsToday?: { opens: number; closes: number; totalOpenSeconds: number };
}

export interface UseDoorStateSSEReturn {
  doorState: DoorState | null;
  isLive: boolean;
  error: string | null;
  reconnect: () => void;
}

export function useDoorStateSSE(coldCellId: string | undefined): UseDoorStateSSEReturn {
  const [doorState, setDoorState] = useState<DoorState | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchRef = useRef<AbortController | null>(null);
  const reconnectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (!coldCellId) return;

    setError(null);

    // Fetch initial state (for token + initial data)
    const fetchState = async () => {
      try {
        const data = await coldCellStateApi.getState(coldCellId);
        setDoorState({
          doorState: data.doorState?.doorState ?? null,
          doorLastChangedAt: data.doorState?.doorLastChangedAt ?? null,
          doorOpenCountTotal: data.doorState?.doorOpenCountTotal ?? 0,
          doorCloseCountTotal: data.doorState?.doorCloseCountTotal ?? 0,
          doorStatsToday: data.doorStatsToday,
        });
      } catch (e) {
        setError('Kon state niet laden');
      }
    };
    fetchState();

    // SSE: EventSource doesn't support custom headers, so we use fetch + stream
    const token = Cookies.get('token');
    const url = coldCellStateApi.getSSEUrl(coldCellId);
    const controller = new AbortController();
    fetchRef.current = controller;

    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('SSE verbinding mislukt');
        setIsLive(true);
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const read = () => {
          reader?.read().then(({ done, value }) => {
            if (done) {
              setIsLive(false);
              return;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const payload = JSON.parse(line.slice(6));
                  if (payload.type === 'door_state' || payload.type === 'initial') {
                    setDoorState((prev) => ({
                      doorState: payload.doorState ?? prev?.doorState ?? null,
                      doorLastChangedAt: payload.doorLastChangedAt ?? prev?.doorLastChangedAt ?? null,
                      doorOpenCountTotal: payload.doorOpenCountTotal ?? prev?.doorOpenCountTotal ?? 0,
                      doorCloseCountTotal: payload.doorCloseCountTotal ?? prev?.doorCloseCountTotal ?? 0,
                      doorStatsToday: payload.doorStatsToday ?? prev?.doorStatsToday,
                    }));
                  }
                } catch (_) {}
              }
            }
            read();
          });
        };
        read();
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          setIsLive(false);
          setError('Live verbinding mislukt, gebruik polling');
        }
      });

    return () => {
      controller.abort();
    };
  }, [coldCellId]);

  useEffect(() => {
    const cleanup = connect();
    reconnectRef.current = () => {
      if (fetchRef.current) fetchRef.current.abort();
      connect();
    };
    return () => {
      if (fetchRef.current) fetchRef.current.abort();
      if (cleanup && typeof cleanup === 'function') cleanup();
    };
  }, [connect]);

  // Polling fallback elke 2s: zorgt dat deur + "Vandaag X× open" altijd up-to-date is
  useEffect(() => {
    if (!coldCellId) return;
    const poll = async () => {
      try {
        const data = await coldCellStateApi.getState(coldCellId);
        setDoorState((prev) => ({
          doorState: data.doorState?.doorState ?? prev?.doorState ?? null,
          doorLastChangedAt: data.doorState?.doorLastChangedAt ?? prev?.doorLastChangedAt ?? null,
          doorOpenCountTotal: data.doorState?.doorOpenCountTotal ?? prev?.doorOpenCountTotal ?? 0,
          doorCloseCountTotal: data.doorState?.doorCloseCountTotal ?? prev?.doorCloseCountTotal ?? 0,
          doorStatsToday: data.doorStatsToday ?? prev?.doorStatsToday,
        }));
      } catch (_) {}
    };
    const iv = setInterval(poll, 500);
    poll(); // direct eerste keer
    return () => clearInterval(iv);
  }, [coldCellId]);

  return {
    doorState,
    isLive,
    error,
    reconnect: () => reconnectRef.current?.(),
  };
}
