import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Link } from "expo-router";
import { WordTile } from "./WordTile";
import { GroupDisplay } from "./GroupDisplay";
import { GameState, Group, WORDS_PER_GROUP, MAX_MISTAKES } from "@/utils/gameLogic";

interface GameBoardProps {
  gameState: GameState;
  groups: Group[];
  onSelectWord: (word: string) => void;
  onSubmit: () => { success: boolean; isClose: boolean };
  onDeselectAll: () => void;
  onShuffle: () => void;
  showRandomLink?: boolean;
}

export function GameBoard({
  gameState,
  groups,
  onSelectWord,
  onSubmit,
  onDeselectAll,
  onShuffle,
  showRandomLink = true,
}: GameBoardProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  const canSubmit = gameState.selectedWords.length === WORDS_PER_GROUP;
  const canDeselect = gameState.selectedWords.length > 0;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = () => {
    const result = onSubmit();
    
    if (Platform.OS !== "web") {
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    if (!result.success) {
      triggerShake();
      if (result.isClose) {
        setFeedback("Fast! Ein Wort ist falsch.");
      } else {
        setFeedback("Leider falsch.");
      }
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  // Sort solved groups by difficulty
  const sortedSolvedGroups = [...gameState.solvedGroups].sort((a, b) => {
    const order = { easy: 0, medium: 1, hard: 2, "very-hard": 3 };
    return order[a.difficulty] - order[b.difficulty];
  });

  // Lives display
  const lives = [];
  for (let i = 0; i < MAX_MISTAKES; i++) {
    lives.push(
      <View
        key={i}
        style={[
          styles.life,
          i < gameState.mistakesRemaining ? styles.lifeActive : styles.lifeInactive,
        ]}
      />
    );
  }

  if (gameState.isComplete) {
    return (
      <View style={styles.container}>
        {/* Show all groups in order */}
        {groups
          .sort((a, b) => {
            const order = { easy: 0, medium: 1, hard: 2, "very-hard": 3 };
            return order[a.difficulty] - order[b.difficulty];
          })
          .map((group, index) => (
            <GroupDisplay key={group.name} group={group} animationDelay={index * 150} />
          ))}
        
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, gameState.won ? styles.winText : styles.loseText]}>
            {gameState.won ? "Gewonnen! 🎉" : "Verloren 😔"}
          </Text>
          <Text style={styles.attemptsText}>
            {gameState.attempts.length} Versuche • {MAX_MISTAKES - gameState.mistakesRemaining} Fehler
          </Text>
          {showRandomLink && (
            <Link href="/random" asChild>
              <Pressable style={styles.randomButton}>
                <Text style={styles.randomButtonText}>🎲 Zufallsspiel starten</Text>
              </Pressable>
            </Link>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Solved groups */}
      {sortedSolvedGroups.map((group, index) => (
        <GroupDisplay key={group.name} group={group} animationDelay={0} />
      ))}

      {/* Remaining words grid */}
      <Animated.View
        style={[
          styles.grid,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        {gameState.remainingWords.map((word) => (
          <WordTile
            key={word}
            word={word}
            isSelected={gameState.selectedWords.includes(word)}
            isDisabled={false}
            onPress={() => onSelectWord(word)}
          />
        ))}
      </Animated.View>

      {/* Feedback message */}
      {feedback && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      )}

      {/* Lives */}
      <View style={styles.livesContainer}>
        <Text style={styles.livesLabel}>Versuche übrig:</Text>
        <View style={styles.livesRow}>{lives}</View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={onShuffle}
        >
          <Text style={styles.secondaryButtonText}>Mischen</Text>
        </Pressable>

        <Pressable
          style={[
            styles.button,
            styles.secondaryButton,
            !canDeselect && styles.buttonDisabled,
          ]}
          onPress={onDeselectAll}
          disabled={!canDeselect}
        >
          <Text style={[styles.secondaryButtonText, !canDeselect && styles.buttonTextDisabled]}>
            Abwählen
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.button,
            styles.primaryButton,
            !canSubmit && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={[styles.primaryButtonText, !canSubmit && styles.buttonTextDisabled]}>
            Absenden
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    padding: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 8,
  },
  livesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    gap: 8,
  },
  livesLabel: {
    fontSize: 14,
    color: "#666666",
  },
  livesRow: {
    flexDirection: "row",
    gap: 6,
  },
  life: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  lifeActive: {
    backgroundColor: "#5A594E",
  },
  lifeInactive: {
    backgroundColor: "#D1D1D1",
  },
  feedbackContainer: {
    backgroundColor: "#FFF3CD",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  feedbackText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#856404",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    minWidth: 100,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#5A594E",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#5A594E",
  },
  buttonDisabled: {
    opacity: 0.4,
    ...Platform.select({
      web: {
        cursor: "not-allowed",
      },
    }),
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#5A594E",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonTextDisabled: {
    color: "#999999",
  },
  resultContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  resultText: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  winText: {
    color: "#2D7D46",
  },
  loseText: {
    color: "#C53030",
  },
  attemptsText: {
    fontSize: 16,
    color: "#666666",
  },
  randomButton: {
    backgroundColor: "#5A594E",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 16,
  },
  randomButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
