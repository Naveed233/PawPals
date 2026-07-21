import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/icons';
import { tabBarBottom } from '@/lib/layout';
import { useStore } from '@/store';
import { night } from '@/theme';

/**
 * Floating pill tab bar (night theme): dark rounded bar hovering above the
 * bottom edge, icon-only tabs, active tab = hot-pink circle.
 */

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Icon name={name} color={focused ? night.coral : night.faint} size={24} />
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

export default function TabsLayout() {
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
    left: 24,
    right: 24,
    height: 66,
    borderRadius: 999,
    backgroundColor: night.tabBar,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: night.border,
    paddingTop: 10,
    paddingBottom: 10,
    // soft lift off the warm background
    shadowColor: '#B99A6B',
    shadowOpacity: 0.22,
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
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: night.coral,
  },
  badge: {
    backgroundColor: night.coral,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
