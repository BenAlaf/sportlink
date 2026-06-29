import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  SegmentedButtons,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';

import { Map, type MapMarkerData } from '@/components/map';
import { PillarColors, Spacing } from '@/constants/theme';
import { DEMO_CITY } from '@/data/mock';
import { useLocation } from '@/hooks/use-location';
import { generateRoute } from '@/lib/router';
import { useAppStore } from '@/store/store';
import type { Activity, GeneratedRoute } from '@/types';

export default function RoutesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { coords, status } = useLocation();
  const { savedRoutes, toggleSavedRoute, isRouteSaved } = useAppStore();

  const [distance, setDistance] = useState(5);
  const [activity, setActivity] = useState<Activity>('run');
  const [route, setRoute] = useState<GeneratedRoute | null>(null);
  const [generating, setGenerating] = useState(false);
  const [snack, setSnack] = useState('');
  const seedRef = useRef(0);
  const didInit = useRef(false);

  async function doGenerate() {
    setGenerating(true);
    seedRef.current += 1;
    const r = await generateRoute({
      center: coords,
      distanceKm: Math.round(distance * 10) / 10,
      activity,
      seed: seedRef.current,
    });
    setRoute(r);
    setGenerating(false);
  }

  // Auto-generate one loop once location settles, so the map isn't empty.
  useEffect(() => {
    if (status !== 'loading' && !didInit.current) {
      didInit.current = true;
      doGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const startMarker: MapMarkerData = {
    id: 'start',
    latitude: coords.latitude,
    longitude: coords.longitude,
    color: PillarColors.routes,
    icon: 'map-marker',
  };

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background, paddingTop: insets.top + Spacing.sm }]}>
      <Map
        height={Math.round(height * 0.4)}
        initialRegion={{
          latitude: DEMO_CITY.latitude,
          longitude: DEMO_CITY.longitude,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
        markers={[startMarker]}
        polyline={route ? { coordinates: route.coordinates, color: PillarColors.routes } : null}
        fitCoordinates={route ? route.coordinates : null}
        style={styles.map}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.distanceLabel}>
          <Text variant="labelLarge" style={{ opacity: 0.8 }}>
            Distance
          </Text>
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            {distance.toFixed(1)} km
          </Text>
        </View>
        <Slider
          minimumValue={1}
          maximumValue={15}
          step={0.5}
          value={distance}
          onValueChange={setDistance}
          minimumTrackTintColor={PillarColors.routes}
          maximumTrackTintColor={theme.colors.surfaceVariant}
          thumbTintColor={PillarColors.routes}
        />

        <SegmentedButtons
          value={activity}
          onValueChange={(v) => setActivity(v as Activity)}
          style={styles.activity}
          buttons={[
            { value: 'run', label: 'Run', icon: 'run' },
            { value: 'walk', label: 'Walk', icon: 'walk' },
          ]}
        />

        <Button
          mode="contained"
          icon={route ? 'refresh' : 'map-marker-distance'}
          loading={generating}
          disabled={generating}
          onPress={doGenerate}>
          {route ? 'Regenerate loop' : 'Generate loop'}
        </Button>

        {route ? (
          <Card mode="elevated" style={styles.routeCard}>
            <Card.Content>
              <View style={styles.routeHeader}>
                <Text variant="titleMedium" style={{ fontWeight: '700', flex: 1 }}>
                  {route.name}
                </Text>
                <Chip
                  compact
                  icon={route.source === 'graphhopper' ? 'check-decagram' : 'map-marker-path'}>
                  {route.source === 'graphhopper' ? 'Live route' : 'Sample loop'}
                </Chip>
              </View>
              <View style={styles.statsRow}>
                <Stat icon="map-marker-distance" label={`${route.distanceKm} km`} />
                <Stat icon="clock-outline" label={`${route.estimatedMinutes} min`} />
                <Stat icon="elevation-rise" label={`↑${route.ascentM} m`} />
              </View>
              <Button
                mode={isRouteSaved(route.id) ? 'contained-tonal' : 'outlined'}
                icon={isRouteSaved(route.id) ? 'bookmark' : 'bookmark-outline'}
                style={{ marginTop: Spacing.sm }}
                onPress={() => {
                  const wasSaved = isRouteSaved(route.id);
                  toggleSavedRoute(route);
                  setSnack(wasSaved ? 'Removed from saved' : 'Route saved');
                }}>
                {isRouteSaved(route.id) ? 'Saved' : 'Save route'}
              </Button>
            </Card.Content>
          </Card>
        ) : generating ? (
          <View style={styles.placeholder}>
            <ActivityIndicator />
          </View>
        ) : null}

        {savedRoutes.length > 0 ? (
          <>
            <Text variant="titleMedium" style={styles.savedTitle}>
              Saved routes
            </Text>
            {savedRoutes.map((r) => (
              <Card
                key={r.id}
                mode="elevated"
                style={styles.savedCard}
                onPress={() => setRoute(r)}>
                <Card.Content style={styles.savedContent}>
                  <View style={[styles.savedIcon, { backgroundColor: PillarColors.routes }]}>
                    <MaterialCommunityIcons
                      name={r.activity === 'walk' ? 'walk' : 'run'}
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyLarge" style={{ fontWeight: '600' }}>
                      {r.name}
                    </Text>
                    <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                      {r.distanceKm} km · {r.estimatedMinutes} min
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="map-search-outline"
                    size={22}
                    color={theme.colors.onSurfaceVariant}
                  />
                </Card.Content>
              </Card>
            ))}
          </>
        ) : null}
      </ScrollView>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={1800}>
        {snack}
      </Snackbar>
    </View>
  );
}

function Stat({ icon, label }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
      <MaterialCommunityIcons name={icon} size={18} color={theme.colors.onSurfaceVariant} />
      <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  map: { marginHorizontal: Spacing.md, borderRadius: 16, overflow: 'hidden' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  distanceLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  activity: { marginVertical: Spacing.md },
  routeCard: { marginTop: Spacing.md },
  routeHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  placeholder: { paddingVertical: Spacing.xl, alignItems: 'center' },
  savedTitle: { fontWeight: '700', marginTop: Spacing.lg, marginBottom: Spacing.sm },
  savedCard: { marginBottom: Spacing.sm },
  savedContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  savedIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
