import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
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
import { DEMO_CITY, mockCourts } from '@/data/mock';
import { useLocation } from '@/hooks/use-location';
import { distanceKm, formatDistance, openDirections, type LatLng } from '@/lib/geo';
import { useAppStore } from '@/store/store';
import type { Court, SportType } from '@/types';

type Filter = 'all' | SportType;

const FILTERS: { key: Filter; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
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
  const { coords, usingFallback } = useLocation();
  const { isCourtSaved, toggleSavedCourt } = useAppStore();

  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<LatLng | null>(null);
  const [detail, setDetail] = useState<Court | null>(null);
  const listRef = useRef<FlatList<Court>>(null);

  const courts = useMemo(
    () =>
      mockCourts
        .filter((c) => filter === 'all' || c.sport === filter)
        .map((c) => ({ ...c, distanceKm: distanceKm(coords, c) }))
        .sort((a, b) => a.distanceKm - b.distanceKm),
    [filter, coords],
  );

  const markers: MapMarkerData[] = courts.map((c) => ({
    id: c.id,
    latitude: c.latitude,
    longitude: c.longitude,
    color: sportColor(c.sport),
    icon: sportIcon(c.sport),
  }));

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
          latitude: DEMO_CITY.latitude,
          longitude: DEMO_CITY.longitude,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
        markers={markers}
        selectedId={selectedId}
        focus={focus}
        onMarkerPress={onMarkerPress}
        style={styles.map}
      />

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
            <InfoBanner text="Showing Tel Aviv — turn on location to sort courts by your distance." />
          ) : null
        }
        ListEmptyComponent={
          <Text variant="bodyMedium" style={{ opacity: 0.6, textAlign: 'center', marginTop: Spacing.lg }}>
            No courts match this filter.
          </Text>
        }
        renderItem={({ item }) => (
          <CourtCard
            court={item}
            selected={item.id === selectedId}
            onPress={() => {
              selectCourt(item, false);
              setDetail(item);
            }}
          />
        )}
      />

      <Portal>
        <Modal
          visible={!!detail}
          onDismiss={() => setDetail(null)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          {detail ? (
            <CourtDetail
              court={detail}
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
  selected,
  onPress,
}: {
  court: Court;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
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
            {court.address} · {formatDistance(court.distanceKm)} away
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
      </Card.Content>
    </Card>
  );
}

function CourtDetail({
  court,
  saved,
  onToggleSave,
  onClose,
}: {
  court: Court;
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

      <DetailRow icon="map-marker-outline" text={court.address} />
      {court.surface ? <DetailRow icon="texture-box" text={`Surface: ${court.surface}`} /> : null}
      <DetailRow icon="lightbulb-on-outline" text={court.lit ? 'Floodlit (night play)' : 'No floodlights'} />
      <DetailRow icon={court.free ? 'cash-off' : 'cash'} text={court.free ? 'Free to use' : 'Paid / booking'} />

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
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xl },
  card: { marginBottom: Spacing.sm },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  courtIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: { margin: Spacing.lg, padding: Spacing.lg, borderRadius: 20 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
});
