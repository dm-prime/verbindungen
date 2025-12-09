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
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/contexts/UserContext";
import { formatDate, formatTimestamp, getDifficultyColor } from "@/utils/gameLogic";

export default function HistoryScreen() {
  const { userId, isLoading: userLoading } = useUser();

  const history = useQuery(
    api.gameHistory.getUserHistory,
    userId ? { userId } : "skip"
  );

  if (userLoading || history === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5A594E" />
          <Text style={styles.loadingText}>Lade Spielverlauf...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (history.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Spielverlauf</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Noch keine Spiele</Text>
          <Text style={styles.emptyText}>
            Spiele dein erstes Verbindungen-Spiel, um deinen Verlauf zu sehen!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate stats
  const totalGames = history.length;
  const wins = history.filter((g) => g.won).length;
  const winRate = Math.round((wins / totalGames) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Spielverlauf</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalGames}</Text>
            <Text style={styles.statLabel}>Gespielt</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{wins}</Text>
            <Text style={styles.statLabel}>Gewonnen</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{winRate}%</Text>
            <Text style={styles.statLabel}>Siegquote</Text>
          </View>
        </View>

        {/* Game list */}
        <View style={styles.listContainer}>
          {history.map((game) => (
            <View key={game._id} style={styles.gameCard}>
              <View style={styles.gameHeader}>
                <View style={styles.gameInfo}>
                  <Text style={styles.gameDate}>
                    {game.board?.date ? formatDate(game.board.date) : "Archivspiel"}
                  </Text>
                  <Text style={styles.playedAt}>
                    Gespielt: {formatTimestamp(game.playedAt)}
                  </Text>
                </View>
                <View style={[styles.resultBadge, game.won ? styles.winBadge : styles.loseBadge]}>
                  <Text style={[styles.resultBadgeText, game.won ? styles.winBadgeText : styles.loseBadgeText]}>
                    {game.won ? "Gewonnen" : "Verloren"}
                  </Text>
                </View>
              </View>

              {/* Groups preview */}
              {game.board?.groups && (
                <View style={styles.groupsPreview}>
                  {game.board.groups
                    .sort((a, b) => {
                      const order = { easy: 0, medium: 1, hard: 2, "very-hard": 3 };
                      return order[a.difficulty as keyof typeof order] - order[b.difficulty as keyof typeof order];
                    })
                    .map((group) => (
                      <View
                        key={group.name}
                        style={[
                          styles.groupPill,
                          { backgroundColor: getDifficultyColor(group.difficulty as any) },
                        ]}
                      >
                        <Text style={styles.groupPillText}>{group.name}</Text>
                      </View>
                    ))}
                </View>
              )}

              <View style={styles.gameFooter}>
                <Text style={styles.attemptsText}>
                  {game.attempts} Versuche
                </Text>
              </View>
            </View>
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
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 4,
  },
  listContainer: {
    gap: 12,
  },
  gameCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  gameInfo: {
    flex: 1,
  },
  gameDate: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  playedAt: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  resultBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  winBadge: {
    backgroundColor: "#D4EDDA",
  },
  loseBadge: {
    backgroundColor: "#F8D7DA",
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  winBadgeText: {
    color: "#155724",
  },
  loseBadgeText: {
    color: "#721C24",
  },
  groupsPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  groupPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  groupPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1A1A1A",
    textTransform: "uppercase",
  },
  gameFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 8,
  },
  attemptsText: {
    fontSize: 12,
    color: "#666666",
  },
});
