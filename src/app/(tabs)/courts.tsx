import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Text, useTheme } from 'react-native-paper';

import { InfoBanner } from '@/components/info-banner';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { PillarColors, Spacing } from '@/constants/theme';
import { mockCourts } from '@/data/mock';
import type { SportType } from '@/types';

type Filter = 'all' | SportType;

const FILTERS: { key: Filter; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'view-grid-outline' },
  { key: 'basketball', label: 'Basketball', icon: 'basketball' },
  { key: 'tennis', label: 'Tennis', icon: 'tennis' },
];

export default function CourtsScreen() {
  const [filter, setFilter] = useState<Filter>('all');

  const courts = useMemo(
    () =>
      [...mockCourts]
        .filter((c) => filter === 'all' || c.sport === filter)
        .sort((a, b) => a.distanceKm - b.distanceKm),
    [filter],
  );

  return (
    <Screen>
      <ScreenHeader title="Courts" subtitle="Basketball & tennis near Tel Aviv" />
      <InfoBanner text="Live map with pins comes next milestone — here's the list view for now." />

      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            icon={f.icon}
            selected={filter === f.key}
            showSelectedCheck={false}
            onPress={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </View>

      {courts.map((c) => (
        <Card key={c.id} mode="elevated" style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View
              style={[
                styles.courtIcon,
                { backgroundColor: c.sport === 'basketball' ? PillarColors.courts : PillarColors.coach },
              ]}>
              <MaterialCommunityIcons
                name={c.sport === 'basketball' ? 'basketball' : 'tennis'}
                size={22}
                color="#fff"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                {c.name}
              </Text>
              <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                {c.address} · {c.distanceKm} km away
              </Text>
              <View style={styles.badges}>
                {c.surface ? <Badge icon="texture-box" label={c.surface} /> : null}
                {c.lit ? <Badge icon="lightbulb-on-outline" label="Lit" /> : null}
                <Badge
                  icon={c.free ? 'cash-off' : 'cash'}
                  label={c.free ? 'Free' : 'Paid'}
                />
              </View>
            </View>
          </Card.Content>
        </Card>
      ))}
    </Screen>
  );
}

function Badge({ icon, label }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.colors.surfaceVariant }]}>
      <MaterialCommunityIcons name={icon} size={12} color={theme.colors.onSurfaceVariant} />
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  card: { marginBottom: Spacing.sm },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  courtIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badges: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
});
