import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { useTodaysGame } from "@/hooks/useGame";
import { GameBoard } from "@/components/game/GameBoard";
import { GroupDisplay } from "@/components/game/GroupDisplay";
import { formatDate, MAX_MISTAKES, Group } from "@/utils/gameLogic";
import { useUser } from "@/contexts/UserContext";

export default function HomeScreen() {
  const { isLoading: userLoading } = useUser();
  const {
    gameState,
    board,
    isLoading,
    hasPlayed,
    previousResult,
    noBoardToday,
    selectWord,
    submitGuess,
    deselectAll,
    shuffle,
  } = useTodaysGame();

  if (userLoading || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5A594E" />
          <Text style={styles.loadingText}>Laden...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (noBoardToday) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Kein Spiel heute</Text>
          <Text style={styles.emptyText}>
            Schau morgen wieder vorbei oder spiele ein zufälliges Archivspiel!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Already played - show result
  if (hasPlayed && previousResult && board) {
    const sortedGroups = [...(board.groups as Group[])].sort((a, b) => {
      const order = { easy: 0, medium: 1, hard: 2, "very-hard": 3 };
      return order[a.difficulty] - order[b.difficulty];
    });

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Verbindungen</Text>
            <Text style={styles.date}>{formatDate(board.date)}</Text>
          </View>

          <View style={styles.resultBanner}>
            <Text style={[styles.resultText, previousResult.won ? styles.winText : styles.loseText]}>
              {previousResult.won ? "Gewonnen! 🎉" : "Verloren 😔"}
            </Text>
            <Text style={styles.resultDetails}>
              Du hast dieses Spiel bereits gespielt.
            </Text>
          </View>

          <View style={styles.boardContainer}>
            {sortedGroups.map((group, index) => (
              <GroupDisplay key={group.name} group={group} animationDelay={index * 100} />
            ))}
          </View>
        </ScrollView>
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Verbindungen</Text>
          <Text style={styles.date}>{formatDate(board.date)}</Text>
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
  resultBanner: {
    backgroundColor: "#F0F0F0",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "center",
  },
  resultText: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  winText: {
    color: "#2D7D46",
  },
  loseText: {
    color: "#C53030",
  },
  resultDetails: {
    fontSize: 14,
    color: "#666666",
  },
});
