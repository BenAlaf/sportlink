/** Subtle "coming soon / fallback active" note used while features run on mock data. */

import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, useTheme } from 'react-native-paper';

import { Spacing } from '@/constants/theme';

export function InfoBanner({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: 12,
        padding: Spacing.sm + 2,
        marginBottom: Spacing.md,
      }}>
      <MaterialCommunityIcons
        name="information-outline"
        size={18}
        color={theme.colors.onSurfaceVariant}
      />
      <Text variant="bodySmall" style={{ flex: 1, color: theme.colors.onSurfaceVariant }}>
        {text}
      </Text>
    </View>
  );
}
