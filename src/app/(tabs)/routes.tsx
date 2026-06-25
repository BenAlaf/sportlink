import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Chip, IconButton, Snackbar, Text, useTheme } from 'react-native-paper';

import { InfoBanner } from '@/components/info-banner';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { PillarColors, Spacing } from '@/constants/theme';
import { ROUTE_DISTANCES, mockRoutes } from '@/data/mock';
import { useAppStore } from '@/store/store';
import type { RunRoute } from '@/types';

const TERRAIN_ICON = {
  road: 'road-variant',
  park: 'tree',
  beach: 'beach',
  mixed: 'map-marker-path',
} as const;

export default function RoutesScreen() {
  const theme = useTheme();
  const { toggleSavedRoute, isRouteSaved } = useAppStore();
  const [target, setTarget] = useState<number>(5);
  const [generated, setGenerated] = useState<RunRoute[]>([]);
  const [snack, setSnack] = useState('');

  function generate() {
    const route: RunRoute = {
      id: `gen-${Date.now()}`,
      name: `${target} km Loop near you`,
      distanceKm: target,
      elevationM: Math.round(target * 6),
      terrain: 'mixed',
      estimatedMinutes: Math.round(target * 6),
      description: 'A loop starting and ending at your location. Connect GraphHopper for live, road-aware routing.',
    };
    setGenerated((prev) => [route, ...prev]);
    setSnack(`Generated a ${target} km loop`);
  }

  const routes = [...generated, ...mockRoutes];

  return (
    <Screen>
      <ScreenHeader title="Routes" subtitle="Find or generate a running loop" />
      <InfoBanner text="Map preview & real loop generation arrive next — these are sample loops for now." />

      <Text variant="labelLarge" style={styles.label}>
        Target distance
      </Text>
      <View style={styles.chipRow}>
        {ROUTE_DISTANCES.map((d) => (
          <Chip key={d} selected={target === d} showSelectedCheck={false} onPress={() => setTarget(d)}>
            {d} km
          </Chip>
        ))}
      </View>

      <Button
        mode="contained"
        icon="map-marker-distance"
        style={styles.generate}
        onPress={generate}>
        Generate a {target} km loop
      </Button>

      {routes.map((r) => {
        const saved = isRouteSaved(r.id);
        return (
          <Card key={r.id} mode="elevated" style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <View style={[styles.routeIcon, { backgroundColor: PillarColors.routes }]}>
                  <MaterialCommunityIcons name="run" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                    {r.name}
                  </Text>
                  <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                    {r.distanceKm} km · ~{r.estimatedMinutes} min · ↑{r.elevationM} m
                  </Text>
                </View>
                <IconButton
                  icon={saved ? 'bookmark' : 'bookmark-outline'}
                  iconColor={saved ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  onPress={() => {
                    toggleSavedRoute(r.id);
                    setSnack(saved ? 'Removed from saved' : 'Saved route');
                  }}
                />
              </View>
              <Text variant="bodyMedium" style={{ opacity: 0.85, marginTop: 4 }}>
                {r.description}
              </Text>
              <Chip
                compact
                icon={TERRAIN_ICON[r.terrain]}
                style={styles.terrainChip}
                textStyle={{ textTransform: 'capitalize' }}>
                {r.terrain}
              </Chip>
            </Card.Content>
          </Card>
        );
      })}

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={1800}>
        {snack}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: Spacing.sm, opacity: 0.8 },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  generate: { marginBottom: Spacing.lg },
  card: { marginBottom: Spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  routeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terrainChip: { alignSelf: 'flex-start', marginTop: Spacing.sm },
});
