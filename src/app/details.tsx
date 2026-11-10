import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Calendar,
  Repeat,
  CloudOff,
  Edit3,
  Trash2,
} from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { useWatch } from '@/context/WatchContext';
import { WatchBadge } from '@/components/WatchBadge';
import { formatDateCompact } from '@/utils/dateUtils';
import { WatchEditTaskModal } from '@/components/WatchEditTaskModal';

export default function DetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, completeTask, snoozeTask, deleteTask, editTask } = useWatch();

  const [operating, setOperating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Actividad no encontrada</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={16} color={Palette.text} />
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Mantenimiento',
      `¿Deseas eliminar "${task.title}"? Esta acción se sincronizará con KeepUp Mobile.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setOperating(true);
              await deleteTask(task.id);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar');
            } finally {
              setOperating(false);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    try {
      setOperating(true);
      await completeTask(task.id);
      Alert.alert(
        '¡Mantenimiento Completado!',
        `Se ha marcado como realizado "${task.title}". El contador de tiempo y la próxima fecha se han reiniciado según su periodicidad (${task.frequency_value} ${task.frequency_unit}).`,
        [{ text: 'Aceptar', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo completar');
    } finally {
      setOperating(false);
    }
  };

  const handleSnooze = async (days: number) => {
    try {
      setOperating(true);
      await snoozeTask(task.id, days);
      Alert.alert(
        'Recordatorio Pospuesto',
        `Pospuesto por +${days} días en este reloj. Se sincronizará con KeepUp Mobile cuando esté disponible.`
      );
    } catch (e) {
      console.error(e);
    } finally {
      setOperating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Botón de Regreso Superior */}
      <View style={styles.navTopBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color={Palette.sage} />
          <Text style={styles.backBtnText}>Atrás</Text>
        </TouchableOpacity>
        <WatchBadge status={task.computed_status} daysRemaining={task.days_remaining} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cabecera del Mantenimiento */}
        <View style={styles.detailCard}>
          <Text style={styles.assetCategoryTag}>{task.asset_category}</Text>
          <Text style={styles.assetName}>{task.asset_name}</Text>
          <Text style={styles.taskTitle}>{task.title}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Calendar size={16} color={Palette.sage} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Fecha límite</Text>
                <Text style={styles.infoVal}>{formatDateCompact(task.next_due_date)} ({task.next_due_date})</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Repeat size={16} color={Palette.sage} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Frecuencia</Text>
                <Text style={styles.infoVal}>Cada {task.frequency_value} {task.frequency_unit}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Acciones Rápidas del Reloj */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

        {/* Botón Principal: Marcar Realizado */}
        <TouchableOpacity
          style={[styles.bigActionButton, styles.completeBtn, operating && { opacity: 0.6 }]}
          onPress={handleComplete}
          disabled={operating}>
          <CheckCircle size={22} color="#FFFFFF" />
          <View style={{ flex: 1 }}>
            <Text style={styles.completeBtnText}>Marcar Realizado y Reiniciar</Text>
            <Text style={styles.btnSubText}>Calcula nueva fecha y reinicia el contador</Text>
          </View>
        </TouchableOpacity>

        {/* Botones Secundarios: Posponer */}
        <View style={styles.snoozeRow}>
          <TouchableOpacity
            style={[styles.snoozeBtn, operating && { opacity: 0.6 }]}
            onPress={() => handleSnooze(3)}
            disabled={operating}>
            <Clock size={16} color={Palette.warning} />
            <Text style={styles.snoozeBtnText}>Posponer 3d</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.snoozeBtn, operating && { opacity: 0.6 }]}
            onPress={() => handleSnooze(7)}
            disabled={operating}>
            <Clock size={16} color={Palette.warning} />
            <Text style={styles.snoozeBtnText}>Posponer 7d</Text>
          </TouchableOpacity>
        </View>

        {/* Botones de Gestión: Editar y Borrar */}
        <View style={styles.manageRow}>
          <TouchableOpacity
            style={[styles.manageBtn, styles.editBtn, operating && { opacity: 0.6 }]}
            onPress={() => setIsEditModalOpen(true)}
            disabled={operating}>
            <Edit3 size={16} color={Palette.sage} />
            <Text style={styles.manageBtnText}>Editar Tarea</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.manageBtn, styles.deleteBtn, operating && { opacity: 0.6 }]}
            onPress={handleDelete}
            disabled={operating}>
            <Trash2 size={16} color={Palette.danger} />
            <Text style={[styles.manageBtnText, { color: Palette.danger }]}>Borrar</Text>
          </TouchableOpacity>
        </View>

        {/* Nota de Regla de Negocio */}
        <View style={styles.syncNoticeCard}>
          <CloudOff size={15} color={Palette.textMuted} />
          <Text style={styles.syncNoticeText}>
            Al marcarlo realizado, se reinicia la próxima fecha según su periodicidad y se sincroniza en tiempo real con Supabase y KeepUp Mobile.
          </Text>
        </View>
      </ScrollView>

      {/* Modal de edición desde el reloj */}
      <WatchEditTaskModal
        visible={isEditModalOpen}
        task={task}
        onClose={() => setIsEditModalOpen(false)}
        onSave={async (taskId, fields) => {
          await editTask(taskId, fields);
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
  navTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: Palette.cardBackground,
  },
  backBtnText: {
    color: Palette.sage,
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 32,
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: Palette.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 16,
    color: Palette.textMuted,
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    marginBottom: 16,
  },
  assetCategoryTag: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.sage,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  assetName: {
    fontSize: 14,
    color: Palette.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Palette.text,
    marginBottom: 14,
  },
  infoGrid: {
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1F2922',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: Palette.textMuted,
    textTransform: 'uppercase',
  },
  infoVal: {
    fontSize: 13,
    color: Palette.text,
    fontWeight: '700',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  bigActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  completeBtn: {
    backgroundColor: Palette.forest,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  btnSubText: {
    color: Palette.sage,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  snoozeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  snoozeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1C1914',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#382D19',
  },
  snoozeBtnText: {
    color: Palette.warning,
    fontSize: 13,
    fontWeight: '700',
  },
  manageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  manageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  editBtn: {
    backgroundColor: '#16231D',
    borderColor: '#244B3A',
  },
  deleteBtn: {
    backgroundColor: Palette.dangerBg,
    borderColor: '#4A1D20',
  },
  manageBtnText: {
    color: Palette.sage,
    fontSize: 13,
    fontWeight: '700',
  },
  syncNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#131815',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1D2520',
  },
  syncNoticeText: {
    flex: 1,
    fontSize: 11,
    color: Palette.textMuted,
    lineHeight: 15,
  },
});

