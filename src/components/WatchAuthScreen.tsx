import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Watch, LogIn, UserPlus, MailCheck } from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

export const WatchAuthScreen: React.FC = () => {
  const { signIn, signUp, resendConfirmationEmail } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showResendBtn, setShowResendBtn] = useState(false);

  const handleResend = async () => {
    if (!email.trim()) {
      Alert.alert('Atención', 'Ingresa tu correo para reenviar la confirmación.');
      return;
    }
    setLoading(true);
    const { error } = await resendConfirmationEmail(email);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Correo enviado', 'Enlace enviado a tu bandeja.');
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Ingresa correo y contraseña.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);
    setShowResendBtn(false);

    try {
      if (isRegister) {
        const { error, isNeedsConfirmation } = await signUp(email, password, displayName);
        if (error) throw error;
        if (isNeedsConfirmation) {
          setInfoMessage('¡Cuenta creada! Revisa tu correo para confirmarla antes de acceder.');
          setShowResendBtn(true);
          setIsRegister(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message?.toLowerCase().includes('email not confirmed')) {
            setShowResendBtn(true);
            throw new Error('Correo no confirmado aún. Revisa tu bandeja.');
          }
          throw error;
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de acceso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Watch size={28} color={Palette.sage} />
          </View>

          <Text style={styles.title}>KeepUp Watch</Text>
          <Text style={styles.subtitle}>
            {isRegister
              ? 'Crear cuenta compartida'
              : 'Inicia con la misma cuenta que KeepUp Mobile'}
          </Text>

          {infoMessage && (
            <View style={styles.infoBox}>
              <MailCheck size={18} color={Palette.sage} style={{ marginBottom: 4 }} />
              <Text style={styles.infoText}>{infoMessage}</Text>
            </View>
          )}

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {showResendBtn && (
            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleResend}
              disabled={loading}>
              <Text style={styles.resendBtnText}>Reenviar correo</Text>
            </TouchableOpacity>
          )}

          {isRegister && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                placeholderTextColor={Palette.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={255}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@correo.com"
              placeholderTextColor={Palette.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              maxLength={255}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Palette.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              maxLength={255}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Palette.text} />
            ) : (
              <>
                {isRegister ? <UserPlus size={16} color="#FFFFFF" /> : <LogIn size={16} color="#FFFFFF" />}
                <Text style={styles.submitBtnText}>
                  {isRegister ? 'Crear' : 'Acceder'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeBtn}
            onPress={() => {
              setIsRegister(!isRegister);
              setErrorMessage(null);
            }}>
            <Text style={styles.switchModeText}>
              {isRegister
                ? '¿Ya tienes cuenta? Iniciar'
                : '¿Nueva cuenta? Crear aquí'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.forestLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: Palette.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: Palette.dangerBg,
    padding: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 11,
    color: Palette.danger,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#1E3329',
    padding: 8,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 11,
    color: Palette.sage,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendBtn: {
    backgroundColor: '#1E3329',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  resendBtnText: {
    color: Palette.sage,
    fontWeight: '700',
    fontSize: 11,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#101512',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Palette.text,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.forest,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  switchModeBtn: {
    marginTop: 12,
    alignItems: 'center',
    padding: 4,
  },
  switchModeText: {
    fontSize: 11,
    color: Palette.sage,
    fontWeight: '600',
  },
});

