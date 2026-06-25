import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Divider, IconButton, Text, TextInput, useTheme } from 'react-native-paper';

import { InfoBanner } from '@/components/info-banner';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { PillarColors, Spacing } from '@/constants/theme';
import { coachSuggestions, sampleTrainingPlan } from '@/data/mock';
import { useAppStore } from '@/store/store';

interface Message {
  id: string;
  from: 'user' | 'coach';
  text: string;
}

/** Placeholder reply logic until the OpenAI Edge Function lands (M4). */
function cannedReply(question: string, name: string): string {
  const q = question.toLowerCase();
  if (q.includes('endurance') || q.includes('stamina')) {
    return `Build endurance gradually, ${name} — add one longer easy run each week and keep most runs at a pace where you can still talk.`;
  }
  if (q.includes('eat') || q.includes('food') || q.includes('nutrition')) {
    return 'Before a run, aim for a light carb snack 30–60 min ahead (banana, toast). Hydrate, and keep it low-fiber to avoid stomach trouble.';
  }
  if (q.includes('knee') || q.includes('injur') || q.includes('pain') || q.includes('sore')) {
    return "Let's go easier this week: swap one run for tennis or a walk, ice after activity, and stop if pain is sharp. See a physio if it persists.";
  }
  return 'Good question! Once the AI coach is connected, I’ll tailor this to your full profile and history. For now, stick to the weekly plan below.';
}

export default function CoachScreen() {
  const theme = useTheme();
  const { profile } = useAppStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      from: 'coach',
      text: `Hi ${profile.name}! I’ve put together a plan for a ${profile.fitnessLevel} athlete. Ask me anything about it.`,
    },
  ]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: `u-${Date.now()}`, from: 'user', text: trimmed };
    const coachMsg: Message = {
      id: `c-${Date.now()}`,
      from: 'coach',
      text: cannedReply(trimmed, profile.name),
    };
    setMessages((prev) => [...prev, userMsg, coachMsg]);
    setInput('');
  }

  return (
    <Screen>
      <ScreenHeader title="Coach" subtitle="Your personalized training plan" />
      <InfoBanner text="Rule-based coach is active. Add an OpenAI key to unlock richer, conversational plans." />

      <Card mode="elevated" style={styles.planCard}>
        <Card.Content>
          <View style={styles.planHeader}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={PillarColors.coach} />
            <Text variant="titleMedium" style={{ fontWeight: '700' }}>
              {sampleTrainingPlan.title}
            </Text>
          </View>
          <Text variant="bodyMedium" style={{ opacity: 0.8, marginVertical: Spacing.sm }}>
            {sampleTrainingPlan.summary}
          </Text>
          <Divider style={{ marginBottom: Spacing.sm }} />
          {sampleTrainingPlan.days.map((d) => (
            <View key={d.day} style={styles.dayRow}>
              <View style={[styles.dayChip, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="labelSmall" style={{ fontWeight: '700' }}>
                  {d.day}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                  {d.title}
                </Text>
                <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                  {d.detail}
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.chatTitle}>
        Ask the coach
      </Text>

      {messages.map((m) => (
        <View
          key={m.id}
          style={[
            styles.bubble,
            m.from === 'user'
              ? { backgroundColor: theme.colors.primary, alignSelf: 'flex-end' }
              : { backgroundColor: theme.colors.surfaceVariant, alignSelf: 'flex-start' },
          ]}>
          <Text
            variant="bodyMedium"
            style={{ color: m.from === 'user' ? theme.colors.onPrimary : theme.colors.onSurface }}>
            {m.text}
          </Text>
        </View>
      ))}

      <View style={styles.suggestions}>
        {coachSuggestions.map((s) => (
          <Chip key={s} compact onPress={() => send(s)}>
            {s}
          </Chip>
        ))}
      </View>

      <TextInput
        mode="outlined"
        placeholder="Type a question…"
        value={input}
        onChangeText={setInput}
        onSubmitEditing={() => send(input)}
        right={<TextInput.Icon icon="send" onPress={() => send(input)} />}
        style={{ marginTop: Spacing.sm }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  planCard: { marginBottom: Spacing.lg },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  dayChip: {
    width: 44,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTitle: { fontWeight: '700', marginBottom: Spacing.sm },
  bubble: { maxWidth: '85%', borderRadius: 14, padding: Spacing.sm + 2, marginBottom: Spacing.sm },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
});
