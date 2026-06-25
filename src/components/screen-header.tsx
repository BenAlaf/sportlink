/** Large in-content screen title with optional subtitle. */

import { View } from 'react-native';
import { Text } from 'react-native-paper';

import { Spacing } from '@/constants/theme';

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text variant="headlineMedium" style={{ fontWeight: '700' }}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodyMedium" style={{ opacity: 0.7, marginTop: 2 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
