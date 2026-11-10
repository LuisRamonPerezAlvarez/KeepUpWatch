import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/services/supabase';
import {
  WatchAsset,
  WatchMaintenanceTask,
  WatchPendingOperation,
  WatchTaskWithAsset,
} from '@/types/models';
import { getDaysRemaining, getTaskStatus, getTodayDateString, addDaysToDate } from '@/utils/dateUtils';
import { trimmedText, validateInteger, validateText, MAX_TEXT_LENGTH } from '@/utils/validation';

const STORAGE_KEYS = {
  ASSETS: '@keepup_watch/cache_assets',
  TASKS: '@keepup_watch/cache_tasks',
  PENDING_OPS: '@keepup_watch/pending_operations',
  DEVICE_ID: '@keepup_watch/device_id',
};

export function generateUUID(): string {
  return Crypto.randomUUID();
}

export async function getWatchDeviceId(): Promise<string> {
  let devId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!devId) {
    devId = generateUUID();
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, devId);
  }
  return devId;
}

export async function registerWatchDevice(userId: string): Promise<void> {
  try {
    const devId = await getWatchDeviceId();
    const now = new Date().toISOString();

    await supabase.from('devices').upsert({
      id: devId,
      user_id: userId,
      device_name: 'Smartwatch Android (Watch)',
      device_type: 'android',
      app_role: 'watch',
      last_seen_at: now,
      created_at: now,
    });
  } catch (err) {
    console.warn('Error registrando watch en Supabase:', err);
  }
}

/* =========================================================================
   CACHÉ LOCAL DE WATCH
   ========================================================================= */

export async function getCachedWatchAssets(): Promise<WatchAsset[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ASSETS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function setCachedWatchAssets(assets: WatchAsset[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
}

export async function getCachedWatchTasks(): Promise<WatchMaintenanceTask[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function setCachedWatchTasks(tasks: WatchMaintenanceTask[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

export async function getPendingOperations(): Promise<WatchPendingOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_OPS);
    const ops: WatchPendingOperation[] = raw ? JSON.parse(raw) : [];
    return ops.filter((o) => o.status === 'PENDING').sort((a, b) => a.created_at.localeCompare(b.created_at));
  } catch {
    return [];
  }
}

export async function savePendingOperations(ops: WatchPendingOperation[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PENDING_OPS, JSON.stringify(ops));
}

/* =========================================================================
   CONSULTA DE OBJETOS Y TAREAS PARA WATCH
   ========================================================================= */

export async function fetchWatchDataFromSupabase(userId: string): Promise<{
  assets: WatchAsset[];
  tasks: WatchMaintenanceTask[];
}> {
  try {
    const [assetsRes, tasksRes] = await Promise.all([
      supabase.from('assets').select('*').eq('user_id', userId).is('deleted_at', null).order('name'),
      supabase.from('maintenance_tasks').select('*').is('deleted_at', null).order('next_due_date'),
    ]);

    if (assetsRes.data) {
      await setCachedWatchAssets(assetsRes.data as WatchAsset[]);
    }
    if (tasksRes.data) {
      const parsedTasks = (tasksRes.data as any[]).map((t) => ({
        ...t,
        is_one_time: Boolean(t.description?.includes('[ONE_TIME]') || t.is_one_time),
      })) as WatchMaintenanceTask[];
      await setCachedWatchTasks(parsedTasks);
    }

    return {
      assets: (assetsRes.data as WatchAsset[]) || (await getCachedWatchAssets()),
      tasks: (tasksRes.data as WatchMaintenanceTask[]) || (await getCachedWatchTasks()),
    };
  } catch (err) {
    console.warn('Error sincronizando con Supabase desde Watch, usando caché local:', err);
    return {
      assets: await getCachedWatchAssets(),
      tasks: await getCachedWatchTasks(),
    };
  }
}

export async function getWatchTasks(userId: string): Promise<WatchTaskWithAsset[]> {
  const { assets, tasks } = await fetchWatchDataFromSupabase(userId);
  const assetMap = new Map(assets.map((a) => [a.id, a]));

  return tasks
    .filter((t) => !t.deleted_at && assetMap.has(t.asset_id))
    .map((t) => {
      const asset = assetMap.get(t.asset_id)!;
      return {
        ...t,
        asset_name: asset.name,
        asset_category: asset.category,
        days_remaining: getDaysRemaining(t.next_due_date),
        computed_status: getTaskStatus(t.next_due_date),
      };
    })
    .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));
}

export async function getWatchAssets(userId: string): Promise<(WatchAsset & { task_count: number })[]> {
  const { assets, tasks } = await fetchWatchDataFromSupabase(userId);

  return assets.map((a) => ({
    ...a,
    task_count: tasks.filter((t) => t.asset_id === a.id && !t.deleted_at).length,
  }));
}

/* =========================================================================
   ACCIONES RÁPIDAS DESDE WATCH: COMPLETAR & POSPONER
   ========================================================================= */

export async function requestCompleteTask(
  userId: string,
  taskId: string
): Promise<WatchPendingOperation> {
  const opId = generateUUID();
  const now = new Date().toISOString();

  const operation: WatchPendingOperation = {
    id: generateUUID(),
    operation_id: opId,
    action: 'complete',
    target_id: taskId,
    payload: {
      p_task_id: taskId,
      p_operation_id: opId,
      p_completed_at: now,
      p_completed_from: 'watch',
      p_notes: 'Completado desde KeepUp Watch',
      p_cost: null,
    },
    created_at: now,
    status: 'PENDING',
  };

  // Optimistic update local: actualizar de inmediato la tarea en caché para que el contador de tiempo y próxima fecha se reinicien al instante
  const cachedTasks = await getCachedWatchTasks();
  const taskToUpdate = cachedTasks.find((t) => t.id === taskId);
  const isOneTime = Boolean(taskToUpdate?.is_one_time || taskToUpdate?.description?.includes('[ONE_TIME]'));

  if (taskToUpdate) {
    if (isOneTime) {
      // Recordatorio de un solo uso: eliminar de la vista
      taskToUpdate.deleted_at = now;
      await setCachedWatchTasks(cachedTasks.filter((t) => t.id !== taskId));
    } else {
      const nextDate = addDaysToDate(
        getTodayDateString(),
        taskToUpdate.frequency_unit === 'days'
          ? taskToUpdate.frequency_value
          : taskToUpdate.frequency_unit === 'weeks'
          ? taskToUpdate.frequency_value * 7
          : taskToUpdate.frequency_unit === 'months'
          ? taskToUpdate.frequency_value * 30
          : taskToUpdate.frequency_value * 365
      );
      taskToUpdate.last_completed_at = now;
      taskToUpdate.next_due_date = nextDate;
      taskToUpdate.updated_at = now;
      await setCachedWatchTasks(cachedTasks);
    }
  }

  // Encolar localmente primero (garantía offline)
  const pending = await getPendingOperations();
  pending.push(operation);
  await savePendingOperations(pending);

  // Intentar sincronizar con Supabase inmediatamente
  try {
    const { error } = await supabase.rpc('complete_maintenance', operation.payload);
    if (!error) {
      operation.status = 'SYNCED';
      await savePendingOperations(pending.filter((o) => o.operation_id !== opId));

      if (isOneTime) {
        await supabase
          .from('maintenance_tasks')
          .update({ deleted_at: now, updated_at: now })
          .eq('id', taskId);
      }
    }
  } catch (err) {
    console.warn('Watch offline: acción almacenada localmente para sincronización posterior');
    if (isOneTime) {
      pending.push({
        id: generateUUID(),
        operation_id: generateUUID(),
        action: 'delete',
        target_id: taskId,
        payload: { taskId, deleted_at: now },
        created_at: now,
        status: 'PENDING',
      });
      await savePendingOperations(pending);
    }
  }

  return operation;
}

export async function requestSnoozeTask(
  userId: string,
  taskId: string,
  daysToSnooze: number = 3
): Promise<WatchPendingOperation> {
  const snoozeError = validateInteger(String(daysToSnooze), 'Los días para posponer', true, 999999);
  if (snoozeError || daysToSnooze <= 0) throw new Error(snoozeError || 'Los días para posponer deben ser mayores a 0');
  const opId = generateUUID();
  const now = new Date().toISOString();

  const tasks = await getCachedWatchTasks();
  const task = tasks.find((t) => t.id === taskId);
  const newDate = task
    ? addDaysToDate(task.next_due_date, daysToSnooze)
    : addDaysToDate(getTodayDateString(), daysToSnooze);

  if (task) {
    task.next_due_date = newDate;
    task.updated_at = now;
    await setCachedWatchTasks(tasks);
  }

  const operation: WatchPendingOperation = {
    id: generateUUID(),
    operation_id: opId,
    action: 'snooze',
    target_id: taskId,
    payload: {
      taskId,
      newDate,
      daysToSnooze,
    },
    created_at: now,
    status: 'PENDING',
  };

  const pending = await getPendingOperations();
  pending.push(operation);
  await savePendingOperations(pending);

  try {
    const { error } = await supabase
      .from('maintenance_tasks')
      .update({ next_due_date: newDate, updated_at: now })
      .eq('id', taskId);

    if (!error) {
      operation.status = 'SYNCED';
      await savePendingOperations(pending.filter((o) => o.operation_id !== opId));

      try {
        await supabase.from('sync_operations').insert([{
          id: generateUUID(),
          user_id: userId,
          operation_id: opId,
          entity_type: 'maintenance_task',
          entity_id: taskId,
          action: 'snooze',
          payload: { taskId, newDate },
          created_at: now,
        }]);
      } catch {}
    }
  } catch (err) {
    console.warn('Watch offline: posponer guardado localmente');
  }

  return operation;
}

export async function requestDeleteTask(
  userId: string,
  taskId: string
): Promise<WatchPendingOperation> {
  const opId = generateUUID();
  const now = new Date().toISOString();

  // Optimistic update local: remover o marcar borrado
  const cachedTasks = await getCachedWatchTasks();
  const updatedTasks = cachedTasks.filter((t) => t.id !== taskId);
  await setCachedWatchTasks(updatedTasks);

  const operation: WatchPendingOperation = {
    id: generateUUID(),
    operation_id: opId,
    action: 'delete',
    target_id: taskId,
    payload: { taskId, deleted_at: now },
    created_at: now,
    status: 'PENDING',
  };

  const pending = await getPendingOperations();
  pending.push(operation);
  await savePendingOperations(pending);

  try {
    const { error } = await supabase
      .from('maintenance_tasks')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', taskId);

    if (!error) {
      operation.status = 'SYNCED';
      await savePendingOperations(pending.filter((o) => o.operation_id !== opId));

      try {
        await supabase.from('sync_operations').insert([{
          id: generateUUID(),
          user_id: userId,
          operation_id: opId,
          entity_type: 'maintenance_task',
          entity_id: taskId,
          action: 'delete',
          payload: { id: taskId, deleted_at: now },
          created_at: now,
        }]);
      } catch {}
    }
  } catch (err) {
    console.warn('Watch offline: borrado guardado localmente');
  }

  return operation;
}

export async function requestEditTask(
  userId: string,
  taskId: string,
  fields: {
    title: string;
    description?: string | null;
    frequency_value: number;
    frequency_unit: 'days' | 'weeks' | 'months' | 'years';
  }
): Promise<WatchPendingOperation> {
  const titleError = validateText(fields.title, 'El título', true);
  if (titleError) throw new Error(titleError);
  const frequencyError = validateInteger(String(fields.frequency_value), 'La frecuencia', true, 999999);
  if (frequencyError || fields.frequency_value <= 0) throw new Error(frequencyError || 'La frecuencia debe ser mayor a 0');
  if (fields.description && fields.description.length > MAX_TEXT_LENGTH) throw new Error('La descripción no puede superar 255 caracteres');
  fields = { ...fields, title: trimmedText(fields.title), description: fields.description ? trimmedText(fields.description) || null : null };
  const opId = generateUUID();
  const now = new Date().toISOString();

  const cachedTasks = await getCachedWatchTasks();
  const task = cachedTasks.find((t) => t.id === taskId);
  if (task) {
    task.title = fields.title.trim();
    task.description = fields.description?.trim() || null;
    task.frequency_value = fields.frequency_value;
    task.frequency_unit = fields.frequency_unit;
    task.updated_at = now;
    await setCachedWatchTasks(cachedTasks);
  }

  const operation: WatchPendingOperation = {
    id: generateUUID(),
    operation_id: opId,
    action: 'edit',
    target_id: taskId,
    payload: {
      taskId,
      ...fields,
      updated_at: now,
    },
    created_at: now,
    status: 'PENDING',
  };

  const pending = await getPendingOperations();
  pending.push(operation);
  await savePendingOperations(pending);

  try {
    const { error } = await supabase
      .from('maintenance_tasks')
      .update({
        title: fields.title.trim(),
        description: fields.description?.trim() || null,
        frequency_value: fields.frequency_value,
        frequency_unit: fields.frequency_unit,
        updated_at: now,
      })
      .eq('id', taskId);

    if (!error) {
      operation.status = 'SYNCED';
      await savePendingOperations(pending.filter((o) => o.operation_id !== opId));

      try {
        await supabase.from('sync_operations').insert([{
          id: generateUUID(),
          user_id: userId,
          operation_id: opId,
          entity_type: 'maintenance_task',
          entity_id: taskId,
          action: 'update',
          payload: { id: taskId, ...fields },
          created_at: now,
        }]);
      } catch {}
    }
  } catch (err) {
    console.warn('Watch offline: edición guardada localmente');
  }

  return operation;
}

export async function processWatchPendingOperations(): Promise<void> {
  const pending = await getPendingOperations();
  if (pending.length === 0) return;

  const remaining: WatchPendingOperation[] = [];

  for (const op of pending) {
    try {
      if (op.action === 'complete') {
        const { error } = await supabase.rpc('complete_maintenance', op.payload);
        if (error) throw error;
      } else if (op.action === 'snooze') {
        const { error } = await supabase
          .from('maintenance_tasks')
          .update({ next_due_date: op.payload.newDate, updated_at: new Date().toISOString() })
          .eq('id', op.payload.taskId);
        if (error) throw error;
      } else if (op.action === 'delete') {
        const { error } = await supabase
          .from('maintenance_tasks')
          .update({ deleted_at: op.payload.deleted_at, updated_at: new Date().toISOString() })
          .eq('id', op.payload.taskId);
        if (error) throw error;
      } else if (op.action === 'edit') {
        const { error } = await supabase
          .from('maintenance_tasks')
          .update({
            title: op.payload.title,
            description: op.payload.description,
            frequency_value: op.payload.frequency_value,
            frequency_unit: op.payload.frequency_unit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', op.payload.taskId);
        if (error) throw error;
      }
    } catch {
      remaining.push(op);
    }
  }

  await savePendingOperations(remaining);
}
