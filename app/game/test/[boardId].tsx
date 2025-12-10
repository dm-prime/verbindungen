import { GameBoard } from "@/components/game/GameBoard";
import { GroupDisplay } from "@/components/game/GroupDisplay";
import { useGame } from "@/hooks/useGame";
import { formatDate, Group } from "@/utils/gameLogic";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Id } from "@/convex/_generated/dataModel";
import React from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function TestPlayScreen() {
  const { boardId } = useLocalSearchParams<{ boardId: string }>();
  const router = useRouter();

  const {
    gameState,
    board,
    isLoading,
    selectWord,
    submitGuess,
    deselectAll,
    shuffle,
  } = useGame(boardId ? (boardId as Id<"boards">) : null, true); // testMode = true

  if (isLoading || !board) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5A594E" />
          <Text style={styles.loadingText}>Lade Testspiel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5A594E" />
        </View>
      </SafeAreaView>
    );
  }

  // Game complete - show result
  if (gameState.isComplete) {
    const sortedGroups = [...(board.groups as Group[])].sort((a, b) => {
      const order = { easy: 0, medium: 1, hard: 2, "very-hard": 3 };
      return order[a.difficulty] - order[b.difficulty];
    });

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Pressable style={styles.backLink} onPress={() => router.back()}>
              <Text style={styles.backLinkText}>← Zurück</Text>
            </Pressable>
            <Text style={styles.subtitle}>Testspiel</Text>
            <Text style={styles.title}>Verbindungen</Text>
            <Text style={styles.date}>
              {board.date ? formatDate(board.date) : "Kein Datum"}
            </Text>
          </View>

          <View style={styles.testBanner}>
            <Text style={styles.testBannerText}>
              ⚠️ Testmodus - Keine Daten werden gespeichert
            </Text>
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
            <Text style={styles.resultDetails}>
              {gameState.attempts.length} Versuche
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>← Zurück</Text>
          </Pressable>
          <Text style={styles.subtitle}>Testspiel</Text>
          <Text style={styles.title}>Verbindungen</Text>
          <Text style={styles.date}>
            {board.date ? formatDate(board.date) : "Kein Datum"}
          </Text>
          <Text style={styles.instructions}>
            Finde 4 Gruppen mit je 4 zusammengehörigen Wörtern
          </Text>
        </View>

        <View style={styles.testBanner}>
          <Text style={styles.testBannerText}>
            ⚠️ Testmodus - Keine Daten werden gespeichert
          </Text>
        </View>

        <GameBoard
          gameState={gameState}
          groups={board.groups as Group[]}
          onSelectWord={selectWord}
          onSubmit={submitGuess}
          onDeselectAll={deselectAll}
          onShuffle={shuffle}
          showRandomLink={false}
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
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  backLink: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  backLinkText: {
    fontSize: 16,
    color: "#5A594E",
    fontWeight: "600",
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
  testBanner: {
    backgroundColor: "#FFF3CD",
    borderColor: "#FFC107",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  testBannerText: {
    fontSize: 13,
    color: "#856404",
    fontWeight: "600",
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

