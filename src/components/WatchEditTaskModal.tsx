import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { WatchTaskWithAsset } from '@/types/models';
import { limitText, onlyDigits, validateInteger, validateText, MAX_TEXT_LENGTH } from '@/utils/validation';

interface WatchEditTaskModalProps {
  visible: boolean;
  task: WatchTaskWithAsset | null;
  onClose: () => void;
  onSave: (
    taskId: string,
    fields: {
      title: string;
      description?: string | null;
      frequency_value: number;
      frequency_unit: 'days' | 'weeks' | 'months' | 'years';
    }
  ) => Promise<void>;
}

const FREQUENCY_OPTIONS: { key: 'days' | 'weeks' | 'months' | 'years'; label: string }[] = [
  { key: 'days', label: 'Días' },
  { key: 'weeks', label: 'Sem' },
  { key: 'months', label: 'Meses' },
  { key: 'years', label: 'Años' },
];

export const WatchEditTaskModal: React.FC<WatchEditTaskModalProps> = ({
  visible,
  task,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [freqValue, setFreqValue] = useState('1');
  const [freqUnit, setFreqUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('months');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setFreqValue(String(task.frequency_value || 1));
      setFreqUnit(task.frequency_unit);
      setError(null);
    }
  }, [task, visible]);

  if (!task) return null;

  const handleSave = async () => {
    const titleError = validateText(title, 'El título', true);
    if (titleError) {
      setError(titleError);
      return;
    }
    const val = Number(freqValue);
    const frequencyError = validateInteger(freqValue, 'La frecuencia', true, 999999);
    if (frequencyError || !Number.isInteger(val) || val <= 0) {
      setError(frequencyError || 'La frecuencia debe ser mayor a 0');
      return;
    }

    try {
      setSaving(true);
      await onSave(task.id, {
        title: limitText(title).trim(),
        description: limitText(description).trim() || null,
        frequency_value: val,
        frequency_unit: freqUnit,
      });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Editar Actividad
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={Palette.textMuted} />
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            <Text style={styles.inputLabel}>Título</Text>
            <TextInput
              style={[styles.input, error && !title.trim() && styles.inputError]}
              value={title}
              onChangeText={(value) => setTitle(limitText(value))}
              maxLength={MAX_TEXT_LENGTH}
              placeholder="Ej. Cambio de Aceite"
              placeholderTextColor={Palette.textMuted}
            />
            <Text style={styles.counter}>{title.length}/{MAX_TEXT_LENGTH}</Text>

            <Text style={styles.inputLabel}>Notas / Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={(value) => setDescription(limitText(value))}
              maxLength={MAX_TEXT_LENGTH}
              placeholder="Detalles opcionales"
              placeholderTextColor={Palette.textMuted}
              multiline
            />
            <Text style={styles.counter}>{description.length}/{MAX_TEXT_LENGTH}</Text>

            <Text style={styles.inputLabel}>Frecuencia</Text>
            <View style={styles.freqRow}>
              <TextInput
                style={[styles.input, styles.freqInput]}
                value={freqValue}
                onChangeText={(value) => setFreqValue(onlyDigits(value))}
                maxLength={9}
                keyboardType="numeric"
              />
              <View style={styles.unitChips}>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.unitChip, freqUnit === opt.key && styles.unitChipActive]}
                    onPress={() => setFreqUnit(opt.key)}>
                    <Text
                      style={[
                        styles.unitChipText,
                        freqUnit === opt.key && styles.unitChipTextActive,
                      ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}>
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 14,
  },
  modalCard: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 20,
    padding: 16,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
  },
  scroll: {
    flexGrow: 0,
  },
  errorText: {
    color: Palette.danger,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  counter: { color: Palette.textMuted, fontSize: 9, textAlign: 'right', marginTop: -8, marginBottom: 8 },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#101512',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    color: Palette.text,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 10,
  },
  inputError: { borderColor: Palette.danger },
  textArea: {
    height: 50,
    textAlignVertical: 'top',
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  freqInput: {
    width: 60,
    marginBottom: 0,
    textAlign: 'center',
    fontWeight: '700',
  },
  unitChips: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  unitChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#101512',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
  },
  unitChipActive: {
    backgroundColor: Palette.forest,
    borderColor: Palette.sage,
  },
  unitChipText: {
    fontSize: 11,
    color: Palette.textMuted,
    fontWeight: '600',
  },
  unitChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.forest,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

