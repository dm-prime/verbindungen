import { GroupDisplay } from "@/components/game/GroupDisplay";
import { useUser } from "@/contexts/UserContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatDate, formatTimestamp, Group } from "@/utils/gameLogic";
import { useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
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

export default function GameDetailScreen() {
  const { boardId } = useLocalSearchParams<{ boardId: string }>();
  const { userId, isLoading: userLoading } = useUser();

  const gameResult = useQuery(
    api.gameHistory.getGameResult,
    userId && boardId ? { userId, boardId: boardId as Id<"boards"> } : "skip"
  );

  const board = useQuery(
    api.boards.getBoard,
    boardId ? { boardId: boardId as Id<"boards"> } : "skip"
  );

  if (userLoading || gameResult === undefined || board === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5A594E" />
          <Text style={styles.loadingText}>Lade Spiel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!board) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Spiel nicht gefunden</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Zurück</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const sortedGroups = [...(board.groups as Group[])].sort((a, b) => {
    const order = { easy: 0, medium: 1, hard: 2, "very-hard": 3 };
    return order[a.difficulty] - order[b.difficulty];
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>← Zurück</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Verbindungen</Text>
          <Text style={styles.date}>
            {board.date ? formatDate(board.date) : "Zufallsspiel"}
          </Text>
        </View>

        {gameResult && (
          <View style={styles.resultBanner}>
            <Text
              style={[
                styles.resultText,
                gameResult.won ? styles.winText : styles.loseText,
              ]}
            >
              {gameResult.won ? "Gewonnen! 🎉" : "Verloren 😔"}
            </Text>
            <Text style={styles.resultDetails}>
              {gameResult.attempts} Versuche • Gespielt:{" "}
              {formatTimestamp(gameResult.playedAt)}
            </Text>
          </View>
        )}

        <View style={styles.boardContainer}>
          {sortedGroups.map((group, index) => (
            <GroupDisplay
              key={group.name}
              group={group}
              animationDelay={index * 100}
            />
          ))}
        </View>
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
    marginBottom: 16,
  },
  backLink: {
    marginBottom: 16,
  },
  backLinkText: {
    fontSize: 16,
    color: "#5A594E",
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "#5A594E",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
  boardContainer: {
    maxWidth: 500,
    alignSelf: "center",
    width: "100%",
    padding: 8,
  },
});

