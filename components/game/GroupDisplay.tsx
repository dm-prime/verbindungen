import React from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
import { Group, getDifficultyColor } from "@/utils/gameLogic";

interface GroupDisplayProps {
  group: Group;
  animationDelay?: number;
}

export function GroupDisplay({ group, animationDelay = 0 }: GroupDisplayProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.delay(animationDelay),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [animationDelay, fadeAnim, scaleAnim]);

  const backgroundColor = getDifficultyColor(group.difficulty);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Text style={styles.name}>{group.name}</Text>
      <Text style={styles.words}>{group.words.join(", ")}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    textTransform: "uppercase",
    marginBottom: 4,
    textAlign: "center",
  },
  words: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A1A",
    textTransform: "uppercase",
    textAlign: "center",
  },
});
