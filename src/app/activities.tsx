import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, Clock, CalendarDays, CheckCircle2 } from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { useWatch } from '@/context/WatchContext';
import { WatchTaskCard } from '@/components/WatchTaskCard';
import { WatchEditTaskModal } from '@/components/WatchEditTaskModal';

type TabFilter = 'todas' | 'atrasadas' | 'pendientes' | 'futuros';

export default function ActivitiesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { tasks, loading, refreshData, completeTask, deleteTask, editTask } = useWatch();
  const [filter, setFilter] = useState<TabFilter>('todas');
  const [taskToEdit, setTaskToEdit] = useState<any | null>(null);

  React.useEffect(() => {
    if (params.tab && ['todas', 'atrasadas', 'pendientes', 'futuros'].includes(params.tab)) {
      setFilter(params.tab as TabFilter);
    }
  }, [params.tab]);

  const overdue = tasks.filter((t) => t.computed_status === 'overdue');
  const pending = tasks.filter((t) => t.computed_status === 'pending');
  const upcoming = tasks.filter((t) => t.computed_status === 'upcoming');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'atrasadas') return t.computed_status === 'overdue';
    if (filter === 'pendientes') return t.computed_status === 'pending';
    if (filter === 'futuros') return t.computed_status === 'upcoming';
    return true;
  });

  const handleCompleteTask = async (task: any) => {
    try {
      await completeTask(task.id);
      Alert.alert(
        '¡Mantenimiento Completado!',
        `Se ha registrado la finalización de "${task.title}". El contador se ha reiniciado según su periodicidad.`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo completar la tarea');
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

  return (
    <View style={styles.container}>
      {/* Botones de Filtro Compactos */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'todas' && styles.filterBtnActive]}
          onPress={() => setFilter('todas')}>
          <Text
            style={[
              styles.filterBtnText,
              filter === 'todas' && styles.filterBtnTextActive,
            ]}>
            Todas ({tasks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            filter === 'atrasadas' && styles.filterBtnActive,
            filter === 'atrasadas' && { backgroundColor: Palette.dangerBg, borderColor: Palette.danger },
          ]}
          onPress={() => setFilter('atrasadas')}>
          <Text
            style={[
              styles.filterBtnText,
              filter === 'atrasadas' && { color: Palette.danger },
            ]}>
            Atrasadas ({overdue.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            filter === 'pendientes' && styles.filterBtnActive,
            filter === 'pendientes' && { backgroundColor: Palette.warningBg, borderColor: Palette.warning },
          ]}
          onPress={() => setFilter('pendientes')}>
          <Text
            style={[
              styles.filterBtnText,
              filter === 'pendientes' && { color: Palette.warning },
            ]}>
            Próximas ({pending.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            filter === 'futuros' && styles.filterBtnActive,
            filter === 'futuros' && { backgroundColor: '#1E3329', borderColor: Palette.sage },
          ]}
          onPress={() => setFilter('futuros')}>
          <Text
            style={[
              styles.filterBtnText,
              filter === 'futuros' && { color: Palette.sage },
            ]}>
            Futuros ({upcoming.length})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshData}
            tintColor={Palette.sage}
          />
        }>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <CheckCircle2 size={36} color={Palette.sage} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>Sin actividades aquí</Text>
            <Text style={styles.emptySub}>
              {filter === 'atrasadas'
                ? '¡Excelente! No tienes mantenimientos atrasados.'
                : 'No se encontraron tareas pendientes con este filtro.'}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: Palette.background,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Palette.cardBackground,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  filterBtnActive: {
    backgroundColor: Palette.actionButton,
    borderColor: Palette.sage,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textMuted,
  },
  filterBtnTextActive: {
    color: Palette.text,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
  },
  emptyCard: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    marginTop: 20,
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

