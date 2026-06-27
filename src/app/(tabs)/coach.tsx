import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Card,
  Chip,
  Divider,
  IconButton,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { InfoBanner } from '@/components/info-banner';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { PillarColors, Spacing } from '@/constants/theme';
import { coachSuggestions } from '@/data/mock';
import { askCoach } from '@/lib/coach';
import { isBackendConfigured } from '@/lib/config';
import { buildPlan } from '@/lib/planner';
import { indefiniteArticle } from '@/lib/text';
import { useAppStore } from '@/store/store';

interface Message {
  id: string;
  from: 'user' | 'coach';
  text: string;
}

export default function CoachScreen() {
  const theme = useTheme();
  const { profile } = useAppStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [snack, setSnack] = useState('');
  const [variant, setVariant] = useState(0);

  // Auto-regenerates whenever the profile changes; `variant` lets the user
  // request a fresh take via the Regenerate button.
  const plan = useMemo(() => buildPlan(profile, variant), [profile, variant]);

  const [messages, setMessages] = useState<Message[]>([]);

  // Greeting is derived from the live profile each render, so it tracks name and
  // fitness-level changes — unlike chat state, which only seeds once on mount.
  const greeting = `Hi ${profile.name}! I've built a plan for ${indefiniteArticle(
    profile.fitnessLevel,
  )} ${profile.fitnessLevel} athlete. Ask me anything about it.`;
  const thread: Message[] = [{ id: 'intro', from: 'coach', text: greeting }, ...messages];

  function regenerate() {
    setVariant((v) => v + 1);
    setSnack('Fresh plan generated');
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const history = messages.map((m) => ({ from: m.from, text: m.text }));
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, from: 'user', text: trimmed }]);
    setInput('');
    setSending(true);

    const { text: reply } = await askCoach({ question: trimmed, profile, history });
    setMessages((prev) => [...prev, { id: `c-${Date.now()}`, from: 'coach', text: reply }]);
    setSending(false);
  }

  return (
    <Screen>
      <ScreenHeader title="Coach" subtitle="Your personalized training plan" />
      <InfoBanner
        text={
          isBackendConfigured
            ? 'AI coach connected — plans and chat are tailored to your profile.'
            : 'Rule-based coach is active. Add an OpenAI key to unlock richer, conversational plans.'
        }
      />

      <Card mode="elevated" style={styles.planCard}>
        <Card.Content>
          <View style={styles.planHeader}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={PillarColors.coach} />
            <Text variant="titleMedium" style={{ fontWeight: '700', flex: 1 }}>
              {plan.title}
            </Text>
            <IconButton
              icon="refresh"
              size={20}
              onPress={regenerate}
              accessibilityLabel="Regenerate plan"
            />
          </View>
          <Text variant="bodyMedium" style={{ opacity: 0.8, marginBottom: Spacing.sm }}>
            {plan.summary}
          </Text>
          <Divider style={{ marginBottom: Spacing.sm }} />
          {plan.days.map((d) => (
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

      {thread.map((m) => (
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

      {sending && (
        <View style={[styles.bubble, styles.typing, { backgroundColor: theme.colors.surfaceVariant }]}>
          <ActivityIndicator size={16} />
          <Text variant="bodySmall" style={{ opacity: 0.7 }}>
            Coach is thinking…
          </Text>
        </View>
      )}

      <View style={styles.suggestions}>
        {coachSuggestions.map((s) => (
          <Chip key={s} compact disabled={sending} onPress={() => send(s)}>
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
        right={<TextInput.Icon icon="send" disabled={sending} onPress={() => send(input)} />}
        style={{ marginTop: Spacing.sm }}
      />

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={1800}>
        {snack}
      </Snackbar>
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
  typing: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, alignSelf: 'flex-start' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
});
