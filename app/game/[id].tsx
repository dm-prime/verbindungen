import { GroupDisplay } from "@/components/game/GroupDisplay";
import { useUser } from "@/contexts/UserContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatDate, formatTimestamp, Group } from "@/utils/gameLogic";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId, isLoading: userLoading } = useUser();

  const gameResult = useQuery(
    api.gameHistory.getGameResult,
    userId && id ? { userId, boardId: id as Id<"boards"> } : "skip"
  );

  if (userLoading || gameResult === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5A594E" />
          <Text style={styles.loadingText}>Lade Spiel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameResult || !gameResult.board) {
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

  const sortedGroups = [...(gameResult.board.groups as Group[])].sort((a, b) => {
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
          <Text style={styles.title}>Verbindungen</Text>
          <Text style={styles.date}>
            {gameResult.board.date ? formatDate(gameResult.board.date) : "Zufallsspiel"}
          </Text>
          <Text style={styles.playedAt}>
            Gespielt: {formatTimestamp(gameResult.playedAt)}
          </Text>
        </View>

        <View style={styles.resultBanner}>
          <Text style={[styles.resultText, gameResult.won ? styles.winText : styles.loseText]}>
            {gameResult.won ? "Gewonnen! 🎉" : "Verloren 😔"}
          </Text>
          <Text style={styles.resultDetails}>
            {gameResult.attempts} Versuche
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
  backLink: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  backLinkText: {
    fontSize: 16,
    color: "#5A594E",
    fontWeight: "600",
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
  playedAt: {
    fontSize: 12,
    color: "#999999",
    marginTop: 2,
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

