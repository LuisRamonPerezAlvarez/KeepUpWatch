import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, CheckCircle2, Edit3, Trash2 } from 'lucide-react-native';
import { WatchTaskWithAsset } from '@/types/models';
import { Palette } from '@/constants/Colors';
import { WatchBadge } from '@/components/WatchBadge';
import { formatDateCompact, formatFrequency } from '@/utils/dateUtils';

interface WatchTaskCardProps {
  task: WatchTaskWithAsset;
  onPress: () => void;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const WatchTaskCard: React.FC<WatchTaskCardProps> = ({
  task,
  onPress,
  onComplete,
  onEdit,
  onDelete,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.assetName} numberOfLines={1}>
          {task.asset_name}
        </Text>
        <WatchBadge status={task.computed_status} daysRemaining={task.days_remaining} />
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {task.title}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Próximo</Text>
          <Text style={styles.metaValue}>{formatDateCompact(task.next_due_date)}</Text>
        </View>

        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Frecuencia</Text>
          <Text style={styles.metaValue}>
            {task.is_one_time || task.description?.includes('[ONE_TIME]')
              ? 'Única vez'
              : formatFrequency(task.frequency_value, task.frequency_unit)}
          </Text>
        </View>

        <ChevronRight size={18} color={Palette.textMuted} style={styles.arrow} />
      </View>

      <View style={styles.actionsRow}>
        <View style={styles.leftActionButtons}>
          {onEdit && (
            <TouchableOpacity
              style={styles.actionPillBtn}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}>
              <Edit3 size={14} color={Palette.sage} />
              <Text style={styles.actionPillText}>Editar</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={[styles.actionPillBtn, styles.deletePillBtn]}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}>
              <Trash2 size={14} color={Palette.danger} />
              <Text style={[styles.actionPillText, { color: Palette.danger }]}>Borrar</Text>
            </TouchableOpacity>
          )}
        </View>

        {onComplete && (
          <TouchableOpacity
            style={styles.completeBtn}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              onComplete();
            }}>
            <CheckCircle2 size={15} color="#FFFFFF" />
            <Text style={styles.completeBtnText}>Hecho</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  assetName: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.sage,
    flex: 1,
    marginRight: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1F2922',
  },
  metaCol: {
    flexDirection: 'column',
  },
  metaLabel: {
    fontSize: 10,
    color: Palette.textMuted,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12,
    color: Palette.textSecondary,
    fontWeight: '700',
    marginTop: 1,
  },
  arrow: {
    alignSelf: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1F2922',
  },
  leftActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1C2520',
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  deletePillBtn: {
    backgroundColor: Palette.dangerBg,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.sage,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Palette.forest,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 9,
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

