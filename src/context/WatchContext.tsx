import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  WatchAsset,
  WatchPendingOperation,
  WatchTaskWithAsset,
} from '@/types/models';
import * as watchService from '@/services/supabaseWatchData';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/context/AuthContext';

interface WatchContextType {
  loading: boolean;
  syncing: boolean;
  isOnline: boolean;
  lastSyncTime: string | null;
  tasks: WatchTaskWithAsset[];
  assets: (WatchAsset & { task_count: number })[];
  pendingOps: WatchPendingOperation[];
  refreshData: () => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  snoozeTask: (taskId: string, days?: number) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  editTask: (
    taskId: string,
    fields: {
      title: string;
      description?: string | null;
      frequency_value: number;
      frequency_unit: 'days' | 'weeks' | 'months' | 'years';
    }
  ) => Promise<void>;
}

const WatchContext = createContext<WatchContextType | null>(null);

export const WatchDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const [tasks, setTasks] = useState<WatchTaskWithAsset[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [pendingOps, setPendingOps] = useState<WatchPendingOperation[]>([]);

  const refreshData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setSyncing(true);
    try {
      // 1. Reintentar operaciones pendientes de Watch en Supabase
      await watchService.processWatchPendingOperations();

      // 2. Traer tareas y objetos actualizados
      const [tasksData, assetsData, opsData] = await Promise.all([
        watchService.getWatchTasks(user.id),
        watchService.getWatchAssets(user.id),
        watchService.getPendingOperations(),
      ]);

      setTasks(tasksData);
      setAssets(assetsData);
      setPendingOps(opsData);
      setLastSyncTime(new Date().toISOString());
      setIsOnline(true);
    } catch (e) {
      console.warn('Error sincronizando Watch con Supabase:', e);
      setIsOnline(false);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      watchService.registerWatchDevice(user.id);
      refreshData();
    } else {
      setTasks([]);
      setAssets([]);
      setPendingOps([]);
      setLoading(false);
    }
  }, [user, refreshData]);

  // SUSCRIPCIÓN REALTIME EN WATCH
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('keepup_watch_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assets' },
        () => refreshData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_tasks' },
        () => refreshData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_history' },
        () => refreshData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sync_operations' },
        () => refreshData()
      )
      .subscribe((status) => {
        setIsOnline(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshData]);

  const completeTask = async (taskId: string) => {
    if (!user) return;
    await watchService.requestCompleteTask(user.id, taskId);
    await refreshData();
  };

  const snoozeTask = async (taskId: string, days: number = 3) => {
    if (!user) return;
    await watchService.requestSnoozeTask(user.id, taskId, days);
    await refreshData();
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    await watchService.requestDeleteTask(user.id, taskId);
    await refreshData();
  };

  const editTask = async (
    taskId: string,
    fields: {
      title: string;
      description?: string | null;
      frequency_value: number;
      frequency_unit: 'days' | 'weeks' | 'months' | 'years';
    }
  ) => {
    if (!user) return;
    await watchService.requestEditTask(user.id, taskId, fields);
    await refreshData();
  };

  return (
    <WatchContext.Provider
      value={{
        loading,
        syncing,
        isOnline,
        lastSyncTime,
        tasks,
        assets,
        pendingOps,
        refreshData,
        completeTask,
        snoozeTask,
        deleteTask,
        editTask,
      }}>
      {children}
    </WatchContext.Provider>
  );
};

export function useWatch(): WatchContextType {
  const ctx = useContext(WatchContext);
  if (!ctx) {
    throw new Error('useWatch debe ser usado dentro de WatchDataProvider');
  }
  return ctx;
}
