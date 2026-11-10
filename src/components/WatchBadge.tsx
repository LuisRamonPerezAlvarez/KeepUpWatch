import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertCircle, Clock, Check } from 'lucide-react-native';
import { TaskStatus } from '@/types/models';
import { Palette } from '@/constants/Colors';

interface WatchBadgeProps {
  status: TaskStatus;
  daysRemaining: number;
}

export const WatchBadge: React.FC<WatchBadgeProps> = ({ status, daysRemaining }) => {
  if (status === 'overdue') {
    const absDays = Math.abs(daysRemaining);
    return (
      <View style={[styles.badge, { backgroundColor: Palette.dangerBg }]}>
        <AlertCircle size={12} color={Palette.danger} />
        <Text style={[styles.text, { color: Palette.danger }]}>
          Atrasado {absDays}d
        </Text>
      </View>
    );
  }

  if (status === 'pending') {
    return (
      <View style={[styles.badge, { backgroundColor: Palette.warningBg }]}>
        <Clock size={12} color={Palette.warning} />
        <Text style={[styles.text, { color: Palette.warning }]}>
          {daysRemaining === 0 ? 'Hoy' : `${daysRemaining}d`}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: Palette.forestLight }]}>
      <Check size={12} color={Palette.sage} />
      <Text style={[styles.text, { color: Palette.sage }]}>
        En {daysRemaining}d
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});

