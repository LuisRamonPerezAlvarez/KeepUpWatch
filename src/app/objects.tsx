import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Package, Wrench, ChevronRight } from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { useWatch } from '@/context/WatchContext';

export default function ObjectsScreen() {
  const router = useRouter();
  const { assets, tasks, loading, refreshData } = useWatch();

  return (
    <View style={styles.container}>
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
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Objetos Sincronizados</Text>
          <Text style={styles.headerSub}>
            {assets.length} {assets.length === 1 ? 'objeto en caché local' : 'objetos en caché local'}
          </Text>
        </View>

        {assets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Package size={36} color={Palette.sage} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>Sin objetos registrados</Text>
            <Text style={styles.emptySub}>
              Los objetos sincronizados desde KeepUp Mobile aparecerán aquí.
            </Text>
          </View>
        ) : (
          assets.map((asset) => {
            const assetTasks = tasks.filter((t) => t.asset_id === asset.id);
            const hasOverdue = assetTasks.some((t) => t.computed_status === 'overdue');

            return (
              <View key={asset.id} style={styles.assetCard}>
                <View style={styles.assetHeader}>
                  <View style={styles.assetInfoCol}>
                    <Text style={styles.assetName}>{asset.name}</Text>
                    <Text style={styles.assetMeta}>
                      {[asset.brand, asset.model].filter(Boolean).join(' • ') || asset.category}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.taskCountBadge,
                      hasOverdue && { backgroundColor: Palette.dangerBg },
                    ]}>
                    <Wrench size={12} color={hasOverdue ? Palette.danger : Palette.sage} />
                    <Text
                      style={[
                        styles.taskCountText,
                        hasOverdue && { color: Palette.danger },
                      ]}>
                      {assetTasks.length}
                    </Text>
                  </View>
                </View>

                {/* Lista rápida de actividades del objeto */}
                {assetTasks.length > 0 && (
                  <View style={styles.taskList}>
                    {assetTasks.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={styles.taskMiniItem}
                        onPress={() => router.push({ pathname: '/details', params: { id: t.id } })}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.taskMiniTitle} numberOfLines={1}>
                            {t.title}
                          </Text>
                          <Text style={styles.taskMiniDate}>{t.next_due_date}</Text>
                        </View>
                        <ChevronRight size={14} color={Palette.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
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
  headerInfo: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    color: Palette.textMuted,
    marginTop: 2,
  },
  assetCard: {
    backgroundColor: Palette.cardBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
  },
  assetMeta: {
    fontSize: 12,
    color: Palette.sage,
    marginTop: 2,
  },
  taskCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.forestLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  taskCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.sage,
  },
  taskList: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1F2922',
    gap: 6,
  },
  taskMiniItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111613',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  taskMiniTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.text,
  },
  taskMiniDate: {
    fontSize: 11,
    color: Palette.textMuted,
    marginTop: 1,
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

