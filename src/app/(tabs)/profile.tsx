import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Avatar,
  Button,
  Chip,
  SegmentedButtons,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';

import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/store/store';
import type { FitnessLevel, SportType } from '@/types';

const SPORTS: { key: SportType; label: string; icon: string }[] = [
  { key: 'basketball', label: 'Basketball', icon: 'basketball' },
  { key: 'tennis', label: 'Tennis', icon: 'tennis' },
];

const WEEKLY_OPTIONS = [2, 3, 4, 5, 6];

export default function ProfileScreen() {
  const { profile, setProfile } = useAppStore();

  const [name, setName] = useState(profile.name);
  const [level, setLevel] = useState<FitnessLevel>(profile.fitnessLevel);
  const [sports, setSports] = useState<SportType[]>(profile.preferredSports);
  const [goal, setGoal] = useState(profile.goal);
  const [weekly, setWeekly] = useState(profile.weeklyTarget);
  const [snack, setSnack] = useState(false);

  function toggleSport(s: SportType) {
    setSports((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function save() {
    setProfile({
      name: name.trim() || 'Athlete',
      fitnessLevel: level,
      preferredSports: sports,
      goal: goal.trim(),
      weeklyTarget: weekly,
    });
    setSnack(true);
  }

  return (
    <Screen>
      <ScreenHeader title="Profile" subtitle="Used to tailor your plan & suggestions" />

      <View style={styles.avatarRow}>
        <Avatar.Text size={64} label={(name || 'A').slice(0, 1).toUpperCase()} />
        <View style={{ flex: 1 }}>
          <Text variant="titleLarge" style={{ fontWeight: '700' }}>
            {name || 'Athlete'}
          </Text>
          <Text variant="bodySmall" style={{ opacity: 0.7, textTransform: 'capitalize' }}>
            {level} · {weekly} workouts/week
          </Text>
        </View>
      </View>

      <TextInput
        mode="outlined"
        label="Name"
        value={name}
        onChangeText={setName}
        style={styles.field}
      />

      <Text variant="labelLarge" style={styles.label}>
        Fitness level
      </Text>
      <SegmentedButtons
        value={level}
        onValueChange={(v) => setLevel(v as FitnessLevel)}
        buttons={[
          { value: 'beginner', label: 'Beginner' },
          { value: 'intermediate', label: 'Inter.' },
          { value: 'advanced', label: 'Advanced' },
        ]}
        style={styles.field}
      />

      <Text variant="labelLarge" style={styles.label}>
        Preferred sports
      </Text>
      <View style={styles.chipRow}>
        {SPORTS.map((s) => (
          <Chip
            key={s.key}
            icon={s.icon}
            selected={sports.includes(s.key)}
            showSelectedCheck={false}
            onPress={() => toggleSport(s.key)}>
            {s.label}
          </Chip>
        ))}
      </View>

      <Text variant="labelLarge" style={styles.label}>
        Workouts per week
      </Text>
      <SegmentedButtons
        value={String(weekly)}
        onValueChange={(v) => setWeekly(Number(v))}
        buttons={WEEKLY_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
        style={styles.field}
      />

      <TextInput
        mode="outlined"
        label="Training goal"
        value={goal}
        onChangeText={setGoal}
        placeholder="e.g. Run a 10k"
        style={styles.field}
      />

      <Button mode="contained" icon="content-save" onPress={save} style={{ marginTop: Spacing.sm }}>
        Save profile
      </Button>

      <Snackbar visible={snack} onDismiss={() => setSnack(false)} duration={1800}>
        Profile saved
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  field: { marginBottom: Spacing.md },
  label: { marginBottom: Spacing.sm, opacity: 0.8 },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
});
