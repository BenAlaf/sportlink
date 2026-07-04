import { MaterialCommunityIcons } from '@expo/vector-icons';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Modal,
  Portal,
  Text,
  useTheme,
} from 'react-native-paper';

import { InfoBanner } from '@/components/info-banner';
import { Map, type MapMarkerData } from '@/components/map';
import { SportColors, Spacing } from '@/constants/theme';
import { useCourtAddresses } from '@/hooks/use-court-addresses';
import { useLocation } from '@/hooks/use-location';
import { isBackendConfigured } from '@/lib/config';
import { fetchNearbyCourts, type CourtFilter } from '@/lib/courts';
import { formatDistance, openDirections, type LatLng } from '@/lib/geo';
import { useAppStore } from '@/store/store';
import type { Court, SportType } from '@/types';

const FILTERS: { key: CourtFilter; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'view-grid-outline' },
  { key: 'basketball', label: 'Basketball', icon: 'basketball' },
  { key: 'tennis', label: 'Tennis', icon: 'tennis' },
];

const sportColor = (s: SportType) => SportColors[s];
const sportIcon = (s: SportType) => (s === 'basketball' ? 'basketball' : 'tennis');

export default function CourtsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { coords, status, usingFallback } = useLocation();
  const { isCourtSaved, toggleSavedCourt } = useAppStore();

  const [filter, setFilter] = useState<CourtFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<LatLng | null>(null);
  const [detail, setDetail] = useState<Court | null>(null);
  const listRef = useRef<FlatList<Court>>(null);

  // Round the location into the query key so tiny GPS jitter doesn't refetch.
  const latKey = coords.latitude.toFixed(2);
  const lonKey = coords.longitude.toFixed(2);
  const {
    data: courts = [],
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['courts', latKey, lonKey, filter],
    queryFn: () => fetchNearbyCourts({ center: coords, filter }),
    enabled: status !== 'loading', // wait for a real fix (or denial) before the first fetch
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData, // keep the old list visible while a filter switch loads
  });

  // Most OSM courts have no address — fill in a real location on-device from
  // their coordinates, so the list isn't a wall of identical "Basketball court".
  const geocoded = useCourtAddresses(courts);

  const markers: MapMarkerData[] = useMemo(
    () =>
      courts.map((c) => ({
        id: c.id,
        latitude: c.latitude,
        longitude: c.longitude,
        color: sportColor(c.sport),
        icon: sportIcon(c.sport),
      })),
    [courts],
  );

  // Zoom the map to fit the nearby courts once they load.
  const fitCoords = useMemo(
    () => (courts.length > 1 ? courts.map((c) => ({ latitude: c.latitude, longitude: c.longitude })) : null),
    [courts],
  );

  const initialLoading = (status === 'loading' || isFetching) && courts.length === 0 && !isError;

  function selectCourt(court: Court, scrollList: boolean) {
    setSelectedId(court.id);
    setFocus({ latitude: court.latitude, longitude: court.longitude });
    if (scrollList) {
      const index = courts.findIndex((c) => c.id === court.id);
      if (index >= 0) {
        listRef.current?.scrollToIndex({ index, viewPosition: 0.3, animated: true });
      }
    }
  }

  function onMarkerPress(id: string) {
    const court = courts.find((c) => c.id === id);
    if (court) selectCourt(court, true);
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background, paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            icon={f.icon}
            selected={filter === f.key}
            showSelectedCheck={false}
            onPress={() => {
              setFilter(f.key);
              setSelectedId(null);
            }}>
            {f.label}
          </Chip>
        ))}
      </View>

      <Map
        height={Math.round(height * 0.4)}
        initialRegion={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        markers={markers}
        selectedId={selectedId}
        focus={focus}
        fitCoordinates={fitCoords}
        onMarkerPress={onMarkerPress}
        style={styles.map}
      />

      {initialLoading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator />
          <Text variant="bodyMedium" style={styles.stateText}>
            Finding courts near you…
          </Text>
        </View>
      ) : isError ? (
        <View style={styles.stateBox}>
          <MaterialCommunityIcons name="wifi-off" size={40} color={theme.colors.onSurfaceVariant} />
          <Text variant="titleMedium" style={{ fontWeight: '700', marginTop: Spacing.sm }}>
            Couldn’t load courts
          </Text>
          <Text variant="bodyMedium" style={styles.stateText}>
            Check your connection and try again.
          </Text>
          <Button mode="contained" icon="refresh" onPress={() => refetch()} style={{ marginTop: Spacing.md }}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={courts}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={({ index }) =>
            listRef.current?.scrollToOffset({ offset: index * 104, animated: true })
          }
          ListHeaderComponent={
            usingFallback ? (
              <InfoBanner text="Showing courts near Tel Aviv — turn on location to find courts near you." />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.stateBox}>
              <MaterialCommunityIcons
                name="map-marker-off-outline"
                size={40}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodyMedium" style={styles.stateText}>
                No {filter === 'all' ? '' : `${filter} `}courts found within 25 km.
              </Text>
            </View>
          }
          ListFooterComponent={
            isBackendConfigured && courts.length > 0 ? (
              <Text variant="bodySmall" style={styles.attribution}>
                Court data © OpenStreetMap contributors
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <CourtCard
              court={item}
              location={item.address || geocoded[item.id]}
              selected={item.id === selectedId}
              onPress={() => {
                selectCourt(item, false);
                setDetail(item);
              }}
            />
          )}
        />
      )}

      <Portal>
        <Modal
          visible={!!detail}
          onDismiss={() => setDetail(null)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          {detail ? (
            <CourtDetail
              court={detail}
              location={detail.address || geocoded[detail.id]}
              saved={isCourtSaved(detail.id)}
              onToggleSave={() => toggleSavedCourt(detail.id)}
              onClose={() => setDetail(null)}
            />
          ) : null}
        </Modal>
      </Portal>
    </View>
  );
}

function CourtCard({
  court,
  location,
  selected,
  onPress,
}: {
  court: Court;
  location?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const distance = `${formatDistance(court.distanceKm)} away`;
  return (
    <Card
      mode="elevated"
      onPress={onPress}
      style={[
        styles.card,
        selected ? { borderWidth: 2, borderColor: theme.colors.primary } : null,
      ]}>
      <Card.Content style={styles.cardContent}>
        <View style={[styles.courtIcon, { backgroundColor: sportColor(court.sport) }]}>
          <MaterialCommunityIcons name={sportIcon(court.sport)} size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            {court.name}
          </Text>
          <Text variant="bodySmall" style={{ opacity: 0.7 }}>
            {location ? `${location} · ${distance}` : distance}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
      </Card.Content>
    </Card>
  );
}

function CourtDetail({
  court,
  location,
  saved,
  onToggleSave,
  onClose,
}: {
  court: Court;
  location?: string;
  saved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  return (
    <View>
      <View style={styles.detailHeader}>
        <View style={[styles.courtIcon, { backgroundColor: sportColor(court.sport) }]}>
          <MaterialCommunityIcons name={sportIcon(court.sport)} size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleLarge" style={{ fontWeight: '700' }}>
            {court.name}
          </Text>
          <Text variant="bodySmall" style={{ opacity: 0.7, textTransform: 'capitalize' }}>
            {court.sport} · {formatDistance(court.distanceKm)} away
          </Text>
        </View>
        <IconButton
          icon={saved ? 'bookmark' : 'bookmark-outline'}
          iconColor={saved ? theme.colors.primary : theme.colors.onSurfaceVariant}
          onPress={onToggleSave}
        />
      </View>

      <Divider style={{ marginVertical: Spacing.sm }} />

      {location ? <DetailRow icon="map-marker-outline" text={location} /> : null}
      {court.surface ? <DetailRow icon="texture-box" text={`Surface: ${court.surface}`} /> : null}
      {court.lit != null ? (
        <DetailRow icon="lightbulb-on-outline" text={court.lit ? 'Floodlit (night play)' : 'No floodlights'} />
      ) : null}
      {court.free != null ? (
        <DetailRow icon={court.free ? 'cash-off' : 'cash'} text={court.free ? 'Free to use' : 'Paid / booking'} />
      ) : null}

      <Button
        mode="contained"
        icon="directions"
        style={{ marginTop: Spacing.md }}
        onPress={() => openDirections(court, court.name)}>
        Get directions
      </Button>
      <Button mode="text" onPress={onClose} style={{ marginTop: Spacing.xs }}>
        Close
      </Button>
    </View>
  );
}

function DetailRow({ icon, text }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons name={icon} size={18} color={theme.colors.onSurfaceVariant} />
      <Text variant="bodyMedium" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  map: { marginHorizontal: Spacing.md, borderRadius: 16, overflow: 'hidden' },
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xl, flexGrow: 1 },
  card: { marginBottom: Spacing.sm },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  courtIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  stateText: { opacity: 0.7, textAlign: 'center', marginTop: Spacing.xs },
  attribution: { opacity: 0.5, textAlign: 'center', marginTop: Spacing.md },
  modal: { margin: Spacing.lg, padding: Spacing.lg, borderRadius: 20 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
});
