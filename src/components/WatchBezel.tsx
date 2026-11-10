import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Palette } from '@/constants/Colors';

interface WatchBezelProps {
  children: React.ReactNode;
}

const { width: screenWidth } = Dimensions.get('window');
const isTabletOrWide = screenWidth > 500;

export const WatchBezel: React.FC<WatchBezelProps> = ({ children }) => {
  return (
    <View style={styles.outerContainer}>
      <View style={styles.watchDial}>
        {/* Simulación de bisel smartwatch con curva ergonómica y tema AMOLED */}
        <View style={styles.screenInner}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#070908',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchDial: {
    width: '100%',
    maxWidth: isTabletOrWide ? 420 : '100%',
    flex: 1,
    backgroundColor: Palette.background,
    borderLeftWidth: isTabletOrWide ? 2 : 0,
    borderRightWidth: isTabletOrWide ? 2 : 0,
    borderColor: '#1D2721',
  },
  screenInner: {
    flex: 1,
  },
});

