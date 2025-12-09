import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";

interface WordTileProps {
  word: string;
  isSelected: boolean;
  isDisabled: boolean;
  onPress: () => void;
}

export function WordTile({
  word,
  isSelected,
  isDisabled,
  onPress,
}: WordTileProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!isDisabled) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.tile,
          isSelected && styles.selected,
          isDisabled && styles.disabled,
        ]}
      >
        <Text
          style={[
            styles.text,
            isSelected && styles.selectedText,
            isDisabled && styles.disabledText,
          ]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {word}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "23%",
    aspectRatio: 1.4,
    margin: "1%",
  },
  tile: {
    flex: 1,
    backgroundColor: "#E8E4DB",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    ...Platform.select({
      web: {
        cursor: "pointer",
        userSelect: "none",
      },
    }),
  },
  selected: {
    backgroundColor: "#5A594E",
  },
  disabled: {
    opacity: 0.5,
    ...Platform.select({
      web: {
        cursor: "not-allowed",
      },
    }),
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    textTransform: "uppercase",
  },
  selectedText: {
    color: "#FFFFFF",
  },
  disabledText: {
    color: "#666666",
  },
});
