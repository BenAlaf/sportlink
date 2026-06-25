import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

import { Screen } from '@/components/screen';
import { PillarColors, Spacing } from '@/constants/theme';
import { mockCourts, mockRoutes, sampleTrainingPlan } from '@/data/mock';
import { useAppStore } from '@/store/store';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface Pillar {
  key: string;
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
  href: '/routes' | '/courts' | '/coach';
}

const PILLARS: Pillar[] = [
  {
    key: 'routes',
    title: 'Route Discovery',
    subtitle: 'Generate running loops near you',
    icon: 'run',
    color: PillarColors.routes,
    href: '/routes',
  },
  {
    key: 'courts',
    title: 'Court Finder',
    subtitle: 'Basketball & tennis courts nearby',
    icon: 'basketball',
    color: PillarColors.courts,
    href: '/courts',
  },
  {
    key: 'coach',
    title: 'AI Training Coach',
    subtitle: 'A plan built around your goals',
    icon: 'whistle',
    color: PillarColors.coach,
    href: '/coach',
  },
];

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, savedRouteIds } = useAppStore();

  const today = sampleTrainingPlan.days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  const stats = [
    { label: 'Saved routes', value: String(savedRouteIds.length), icon: 'bookmark-outline' as IconName },
    { label: 'Courts nearby', value: String(mockCourts.length), icon: 'map-marker-outline' as IconName },
    { label: 'Routes', value: String(mockRoutes.length), icon: 'map-outline' as IconName },
  ];

  return (
    <Screen>
      <Text variant="titleMedium" style={{ opacity: 0.7 }}>
        Welcome back
      </Text>
      <Text variant="headlineLarge" style={styles.name}>
        {profile.name} 👋
      </Text>

      <View style={styles.statsRow}>
        {stats.map((s) => (
          <Card key={s.label} mode="contained" style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name={s.icon} size={20} color={theme.colors.primary} />
              <Text variant="titleLarge" style={{ fontWeight: '700' }}>
                {s.value}
              </Text>
              <Text variant="bodySmall" style={{ opacity: 0.7, textAlign: 'center' }}>
                {s.label}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Card mode="elevated" style={styles.todayCard} onPress={() => router.push('/coach')}>
        <Card.Content>
          <View style={styles.todayHeader}>
            <MaterialCommunityIcons name="calendar-today" size={18} color={PillarColors.coach} />
            <Text variant="labelLarge" style={{ color: PillarColors.coach }}>
              TODAY · {today.day}
            </Text>
          </View>
          <Text variant="titleLarge" style={{ fontWeight: '700', marginTop: 4 }}>
            {today.title}
          </Text>
          <Text variant="bodyMedium" style={{ opacity: 0.8, marginTop: 2 }}>
            {today.detail}
          </Text>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Explore
      </Text>
      {PILLARS.map((p) => (
        <Card key={p.key} mode="elevated" style={styles.pillarCard} onPress={() => router.push(p.href)}>
          <Card.Content style={styles.pillarContent}>
            <View style={[styles.pillarIcon, { backgroundColor: p.color }]}>
              <MaterialCommunityIcons name={p.icon} size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                {p.title}
              </Text>
              <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                {p.subtitle}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
          </Card.Content>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontWeight: '800', marginBottom: Spacing.lg },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { flex: 1 },
  statContent: { alignItems: 'center', gap: 4 },
  todayCard: { marginBottom: Spacing.lg },
  todayHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontWeight: '700', marginBottom: Spacing.sm },
  pillarCard: { marginBottom: Spacing.sm },
  pillarContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  pillarIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
