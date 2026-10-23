import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/icons';
import { tabBarBottom } from '@/lib/layout';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/store';
import { night, tone } from '@/theme';

/**
 * Floating pill tab bar: a white print-like bar hovering above the bottom edge,
 * icon-only tabs (titles are the accessible names), active tab = action pill.
 */

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapOn]}>
      <Icon name={name} color={focused ? night.onAction : night.muted} size={23} />
    </View>
  );
}

export default function TabsLayout() {
  const { tx } = useI18n();
  const matchCount = useStore((s) => s.matches.length);
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [styles.tabBar, { bottom: tabBarBottom(insets.bottom) }],
        tabBarItemStyle: styles.tabItem,
        tabBarBadgeStyle: styles.badge,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tx('さがす', 'Discover'),
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: tx('マッチ', 'Matches'),
          tabBarBadge: matchCount || undefined,
          tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: tx('マップ', 'Map'),
          tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: tx('イベント', 'Events'),
          tabBarIcon: ({ focused }) => <TabIcon name="calendar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: tx('プロフィール', 'Profile'),
          tabBarIcon: ({ focused }) => <TabIcon name="user" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    // Inset with margins (not left/right) so the floating pill stays symmetric:
    // react-navigation forces its own `right`, which was shoving the bar off-centre.
    left: 0,
    right: 0,
    marginHorizontal: 24,
    height: 66,
    borderRadius: 999,
    backgroundColor: night.tabBar,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: night.border,
    paddingTop: 10,
    paddingBottom: 10,
    // soft lift off the sky ground
    shadowColor: tone.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  tabItem: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 54,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapOn: { backgroundColor: night.coral },
  badge: {
    backgroundColor: night.danger,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
