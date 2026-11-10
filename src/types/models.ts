export type AssetCategory = 'electronica' | 'transporte' | 'hogar' | 'herramientas' | 'otras';
export type MaintenanceFrequencyUnit = 'days' | 'weeks' | 'months' | 'years';
export type TaskStatus = 'overdue' | 'pending' | 'upcoming';
export type TaskPriority = 'low' | 'medium' | 'high';
export type AppRole = 'mobile' | 'watch';
export type DeviceType = 'android' | 'ios' | 'web';

export interface Profile {
  id: string; // UUID (auth.users.id)
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface WatchAsset {
  id: string; // UUID
  user_id: string;
  name: string;
  category: AssetCategory;
  description?: string | null;
  brand?: string | null;
  model?: string | null;
  purchase_date?: string | null;
  status: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WatchMaintenanceTask {
  id: string; // UUID
  asset_id: string;
  title: string;
  description?: string | null;
  frequency_value: number;
  frequency_unit: MaintenanceFrequencyUnit;
  next_due_date: string; // ISO YYYY-MM-DD
  last_completed_at?: string | null;
  status: 'active' | 'paused';
  priority?: TaskPriority | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  is_one_time?: boolean;
}

export interface WatchPendingOperation {
  id: string; // UUID único de la operación
  operation_id: string;
  action: 'complete' | 'snooze' | 'delete' | 'edit';
  target_id: string; // task_id
  payload: any;
  created_at: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
}

export interface WatchTaskWithAsset extends WatchMaintenanceTask {
  asset_name: string;
  asset_category: AssetCategory;
  days_remaining: number;
  computed_status: TaskStatus;
}
