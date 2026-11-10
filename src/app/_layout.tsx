import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, ListTodo, Layers } from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WatchDataProvider } from '@/context/WatchContext';
import { WatchBezel } from '@/components/WatchBezel';
import { WatchAuthScreen } from '@/components/WatchAuthScreen';

function WatchMainTabs() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Palette.background }}>
        <ActivityIndicator size="large" color={Palette.sage} />
      </View>
    );
  }

  if (!session) {
    return <WatchAuthScreen />;
  }

  return (
    <WatchDataProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Palette.sage,
          tabBarInactiveTintColor: Palette.textMuted,
          tabBarStyle: {
            backgroundColor: Palette.background,
            borderTopColor: Palette.cardBorder,
            borderTopWidth: 1,
            height: 58,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          },
          headerStyle: {
            backgroundColor: Palette.background,
            borderBottomColor: Palette.cardBorder,
            borderBottomWidth: 1,
            elevation: 0,
          },
          headerTitleStyle: {
            fontWeight: '800',
            color: Palette.text,
            fontSize: 16,
            letterSpacing: 0.5,
          },
          headerTintColor: Palette.sage,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarLabel: 'Inicio',
            tabBarIcon: ({ color, size }) => <Home size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="activities"
          options={{
            title: 'Actividades',
            tabBarLabel: 'Actividades',
            tabBarIcon: ({ color, size }) => <ListTodo size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="objects"
          options={{
            title: 'Objetos',
            tabBarLabel: 'Objetos',
            tabBarIcon: ({ color, size }) => <Layers size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="details"
          options={{
            title: 'Detalle',
            href: null,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </WatchDataProvider>
  );
}

export default function WatchLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <WatchBezel>
        <WatchMainTabs />
      </WatchBezel>
    </AuthProvider>
  );
}
