import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Pressable,
} from "react-native";
import { useRandomGame } from "@/hooks/useGame";
import { GameBoard } from "@/components/game/GameBoard";
import { GroupDisplay } from "@/components/game/GroupDisplay";
import { formatDate, Group } from "@/utils/gameLogic";
import { useUser } from "@/contexts/UserContext";

export default function RandomScreen() {
  const { isLoading: userLoading } = useUser();
  const {
    gameState,
    board,
    isLoading,
    noPastBoards,
    selectWord,
    submitGuess,
    deselectAll,
    shuffle,
    getNewRandomBoard,
  } = useRandomGame();

  if (userLoading || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5A594E" />
          <Text style={styles.loadingText}>Lade zufälliges Spiel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (noPastBoards) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Keine Spiele verfügbar</Text>
          <Text style={styles.emptyText}>
            Du hast alle verfügbaren Zufallsspiele gespielt! Schau später wieder vorbei.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameState || !board) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5A594E" />
        </View>
      </SafeAreaView>
    );
  }

  // Game complete - show result and option to play another
  if (gameState.isComplete) {
    const sortedGroups = [...(board.groups as Group[])].sort((a, b) => {
      const order = { easy: 0, medium: 1, hard: 2, "very-hard": 3 };
      return order[a.difficulty] - order[b.difficulty];
    });

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.subtitle}>Zufallsspiel</Text>
            <Text style={styles.title}>Verbindungen</Text>
            <Text style={styles.date}>Veröffentlicht: {formatDate(board.date)}</Text>
          </View>

          <View style={styles.boardContainer}>
            {sortedGroups.map((group, index) => (
              <GroupDisplay key={group.name} group={group} animationDelay={index * 100} />
            ))}
          </View>

          <View style={styles.resultContainer}>
            <Text style={[styles.resultText, gameState.won ? styles.winText : styles.loseText]}>
              {gameState.won ? "Gewonnen! 🎉" : "Verloren 😔"}
            </Text>

            <Pressable style={styles.newGameButton} onPress={getNewRandomBoard}>
              <Text style={styles.newGameButtonText}>Neues Zufallsspiel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>Zufallsspiel</Text>
          <Text style={styles.title}>Verbindungen</Text>
          <Text style={styles.date}>Veröffentlicht: {formatDate(board.date)}</Text>
          <Text style={styles.instructions}>
            Finde 4 Gruppen mit je 4 zusammengehörigen Wörtern
          </Text>
        </View>

        <GameBoard
          gameState={gameState}
          groups={board.groups as Group[]}
          onSelectWord={selectWord}
          onSubmit={submitGuess}
          onDeselectAll={deselectAll}
          onShuffle={shuffle}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B7355",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -1,
  },
  date: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  instructions: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },
  boardContainer: {
    maxWidth: 500,
    alignSelf: "center",
    width: "100%",
    padding: 8,
  },
  resultContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  resultText: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 24,
  },
  winText: {
    color: "#2D7D46",
  },
  loseText: {
    color: "#C53030",
  },
  newGameButton: {
    backgroundColor: "#5A594E",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  newGameButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
