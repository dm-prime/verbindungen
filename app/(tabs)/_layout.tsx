import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#151718" : "#FAF9F6",
          borderTopColor: colorScheme === "dark" ? "#2A2A2A" : "#E5E5E5",
        },
        headerStyle: {
          backgroundColor: colorScheme === "dark" ? "#151718" : "#FAF9F6",
        },
        headerTintColor: colorScheme === "dark" ? "#ECEDEE" : "#1A1A1A",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Heute",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="random"
        options={{
          title: "Zufall",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="shuffle" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Verlauf",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="clock" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  );
}
