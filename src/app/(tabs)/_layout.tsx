import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Icon, IconName } from '@/components/icons';
import { useStore } from '@/store';
import { night } from '@/theme';

/**
 * Floating pill tab bar (night theme): dark rounded bar hovering above the
 * bottom edge, icon-only tabs, active tab = hot-pink circle.
 */

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon name={name} color={focused ? '#FFFFFF' : night.muted} size={22} />
    </View>
  );
}

export default function TabsLayout() {
  const matchCount = useStore((s) => s.matches.length);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarBadgeStyle: styles.badge,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'さがす',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'マッチ',
          tabBarBadge: matchCount || undefined,
          tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'マップ',
          tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'イベント',
          tabBarIcon: ({ focused }) => <TabIcon name="calendar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'プロフィール',
          tabBarIcon: ({ focused }) => <TabIcon name="user" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 18,
    left: 60,
    right: 60,
    height: 64,
    borderRadius: 999,
    backgroundColor: night.tabBar,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: night.border,
    paddingTop: 10,
    paddingBottom: 10,
  },
  tabItem: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: night.pink,
  },
  badge: {
    backgroundColor: night.pink,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
