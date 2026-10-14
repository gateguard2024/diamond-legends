'use client';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getRecords, isLoaded, load, subscribe } from './store';
import { DEFAULT_TRYOUT_DATE, PLAYERS, PlayerId } from './program';

const empty: never[] = [];

export function useRecords() {
  const recs = useSyncExternalStore(subscribe, getRecords, () => empty);
  const ready = useSyncExternalStore(subscribe, isLoaded, () => false);
  useEffect(() => {
    load();
  }, []);
  return { recs, ready };
}

export function useTryoutDate() {
  const { recs } = useRecords();
  const s = [...recs].reverse().find((r) => r.kind === 'settings' && r.data.tryoutDate);
  return (s?.data.tryoutDate as string) || DEFAULT_TRYOUT_DATE;
}

const PLAYER_KEY = 'ebt:player';
const playerListeners = new Set<() => void>();

function readPlayer(): PlayerId {
  if (typeof window === 'undefined') return PLAYERS[0].id;
  try {
    const v = window.localStorage.getItem(PLAYER_KEY);
    if (v && PLAYERS.some((p) => p.id === v)) return v as PlayerId;
  } catch {
    /* ignore */
  }
  return PLAYERS[0].id;
}

/** The selected player, remembered on this device. */
export function usePlayer(): [PlayerId, (id: PlayerId) => void] {
  const [id, setId] = useState<PlayerId>(PLAYERS[0].id);
  useEffect(() => {
    setId(readPlayer());
    const fn = () => setId(readPlayer());
    playerListeners.add(fn);
    return () => {
      playerListeners.delete(fn);
    };
  }, []);
  const set = useCallback((next: PlayerId) => {
    try {
      window.localStorage.setItem(PLAYER_KEY, next);
    } catch {
      /* ignore */
    }
    playerListeners.forEach((f) => f());
  }, []);
  return [id, set];
}
