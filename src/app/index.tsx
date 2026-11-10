import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Wifi,
  WifiOff,
  LogOut,
  Radio,
} from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { useWatch } from '@/context/WatchContext';
import { useAuth } from '@/context/AuthContext';
import { WatchTaskCard } from '@/components/WatchTaskCard';
import { WatchEditTaskModal } from '@/components/WatchEditTaskModal';

export default function WatchHomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const {
    tasks,
    pendingOps,
    loading,
    refreshData,
    isOnline,
    syncing,
    completeTask,
    deleteTask,
    editTask,
  } = useWatch();

  const [operatingId, setOperatingId] = React.useState<string | null>(null);
  const [taskToEdit, setTaskToEdit] = React.useState<any | null>(null);

  const handleCompleteTask = async (task: any) => {
    try {
      setOperatingId(task.id);
      await completeTask(task.id);
      Alert.alert(
        '¡Mantenimiento Completado!',
        `Se ha registrado la finalización de "${task.title}". El contador se ha reiniciado según su periodicidad.`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo completar la tarea');
    } finally {
      setOperatingId(null);
    }
  };

  const handleDeleteTask = (task: any) => {
    Alert.alert(
      'Eliminar Mantenimiento',
      `¿Deseas eliminar "${task.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const overdueTasks = tasks.filter((t) => t.computed_status === 'overdue');
  const pendingTasks = tasks.filter((t) => t.computed_status === 'pending');
  const upcomingTasks = tasks.filter((t) => t.computed_status === 'upcoming');

  const handleSignOut = () => {
    Alert.alert('Cerrar Sesión', '¿Deseas cerrar la sesión en este reloj?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading || syncing}
            onRefresh={refreshData}
            tintColor={Palette.sage}
          />
        }>
        {/* Widget Superior Estilo Smartwatch */}
        <View style={styles.dialSummaryCard}>
          <View style={styles.topSyncHeader}>
            <Text style={styles.watchHeaderSubtitle}>RESUMEN DE GUARDIA</Text>
            <View style={styles.syncBadgeBtn}>
              {isOnline ? (
                <Wifi size={13} color={Palette.success} />
              ) : (
                <WifiOff size={13} color={Palette.danger} />
              )}
              <Text
                style={[
                  styles.syncBadgeText,
                  { color: isOnline ? Palette.success : Palette.danger },
                ]}>
                {isOnline ? 'EN VIVO' : 'LOCAL'}
              </Text>
            </View>
          </View>

          <View style={styles.dialCountersRow}>
            <TouchableOpacity
              style={[
                styles.dialCounter,
                overdueTasks.length > 0 && { borderColor: Palette.danger },
              ]}
              onPress={() => router.push({ pathname: '/activities', params: { tab: 'atrasadas' } })}>
              <Text
                style={[
                  styles.counterNumber,
                  { color: overdueTasks.length > 0 ? Palette.danger : Palette.textSecondary },
                ]}>
                {overdueTasks.length}
              </Text>
              <Text style={styles.counterLabel}>Atrasados</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dialCounter,
                pendingTasks.length > 0 && { borderColor: Palette.warning },
              ]}
              onPress={() => router.push({ pathname: '/activities', params: { tab: 'pendientes' } })}>
              <Text
                style={[
                  styles.counterNumber,
                  { color: pendingTasks.length > 0 ? Palette.warning : Palette.textSecondary },
                ]}>
                {pendingTasks.length}
              </Text>
              <Text style={styles.counterLabel}>Próximos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dialCounter}
              onPress={() => router.push({ pathname: '/activities', params: { tab: 'futuros' } })}>
              <Text style={[styles.counterNumber, { color: Palette.sage }]}>
                {upcomingTasks.length}
              </Text>
              <Text style={styles.counterLabel}>Futuros</Text>
            </TouchableOpacity>
          </View>

          {/* Barra de Estado y Acceso a Cierre de Sesión */}
          <View style={styles.offlineStatusBar}>
            <Radio size={13} color={pendingOps.length > 0 ? Palette.warning : Palette.sage} />
            <Text style={styles.offlineStatusText} numberOfLines={1}>
              {pendingOps.length === 0
                ? isOnline
                  ? 'Sincronizado vía Supabase'
                  : 'Modo Offline (Caché activa)'
                : `${pendingOps.length} acción pendiente de subir`}
            </Text>
            <TouchableOpacity onPress={handleSignOut} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <LogOut size={14} color={Palette.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección Urgente: Atrasados si existen */}
        {overdueTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <AlertTriangle size={15} color={Palette.danger} />
              <Text style={[styles.sectionTitle, { color: Palette.danger }]}>
                Requieren Atención ({overdueTasks.length})
              </Text>
            </View>
            {overdueTasks.map((task) => (
              <WatchTaskCard
                key={task.id}
                task={task}
                onPress={() => router.push({ pathname: '/details', params: { id: task.id } })}
                onComplete={() => handleCompleteTask(task)}
                onEdit={() => setTaskToEdit(task)}
                onDelete={() => handleDeleteTask(task)}
              />
            ))}
          </View>
        )}

        {/* Sección Próximos Mantenimientos */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Clock size={15} color={Palette.sage} />
            <Text style={styles.sectionTitle}>Próximos Mantenimientos</Text>
          </View>

          {pendingTasks.length === 0 && overdueTasks.length === 0 && upcomingTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <CheckCircle size={32} color={Palette.sage} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>Todo al día</Text>
              <Text style={styles.emptySub}>No hay actividades inmediatas programadas.</Text>
            </View>
          ) : (
            pendingTasks.concat(upcomingTasks).slice(0, 4).map((task) => (
              <WatchTaskCard
                key={task.id}
                task={task}
                onPress={() => router.push({ pathname: '/details', params: { id: task.id } })}
                onComplete={() => handleCompleteTask(task)}
                onEdit={() => setTaskToEdit(task)}
                onDelete={() => handleDeleteTask(task)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal de edición */}
      <WatchEditTaskModal
        visible={Boolean(taskToEdit)}
        task={taskToEdit}
        onClose={() => setTaskToEdit(null)}
        onSave={async (taskId, fields) => {
          await editTask(taskId, fields);
          setTaskToEdit(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
  },
  dialSummaryCard: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  topSyncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  watchHeaderSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.textMuted,
    letterSpacing: 1,
  },
  syncBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#111613',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  syncBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dialCountersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  dialCounter: {
    flex: 1,
    backgroundColor: '#121714',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#232D26',
  },
  counterNumber: {
    fontSize: 22,
    fontWeight: '900',
  },
  counterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  offlineStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1F2922',
    width: '100%',
    justifyContent: 'space-between',
  },
  offlineStatusText: {
    fontSize: 11,
    color: Palette.textMuted,
    fontWeight: '600',
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.text,
  },
  emptySub: {
    fontSize: 12,
    color: Palette.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
