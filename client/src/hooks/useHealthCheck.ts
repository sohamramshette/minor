import { useState, useEffect, useCallback } from 'react';
import { fetchHealthStatus } from '../services/api';
import { BackendHealth } from '../types';

export function useHealthCheck(pollIntervalMs = 15000) {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const check = useCallback(async () => {
    try {
      const data = await fetchHealthStatus();
      setHealth(data);
    } catch {
      setHealth({ status: 'offline' });
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, pollIntervalMs);
    return () => clearInterval(interval);
  }, [check, pollIntervalMs]);

  return { health, loading, lastChecked, refreshHealth: check };
}
