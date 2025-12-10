import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAdmin } from "@/contexts/AdminContext";
import { formatDate, getDifficultyColor } from "@/utils/gameLogic";
import { Id } from "@/convex/_generated/dataModel";

export default function BoardsScreen() {
  const router = useRouter();
  const { logout } = useAdmin();
  const [deletingId, setDeletingId] = useState<Id<"boards"> | null>(null);

  const boards = useQuery(api.boards.listBoards);
  const deleteBoard = useMutation(api.boards.deleteBoard);
  const seedBoards = useMutation(api.boards.seedSampleBoards);

  const handleDelete = async (boardId: Id<"boards">) => {
    if (Platform.OS === "web") {
      if (!confirm("Spielbrett wirklich löschen?")) return;
    } else {
      Alert.alert(
        "Spielbrett löschen",
        "Bist du sicher, dass du dieses Spielbrett löschen möchtest?",
        [
          { text: "Abbrechen", style: "cancel" },
          {
            text: "Löschen",
            style: "destructive",
            onPress: () => performDelete(boardId),
          },
        ]
      );
      return;
    }
    performDelete(boardId);
  };

  const performDelete = async (boardId: Id<"boards">) => {
    setDeletingId(boardId);
    try {
      await deleteBoard({ boardId });
    } catch (error) {
      console.error("Failed to delete board:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSeedBoards = async () => {
    try {
      const result = await seedBoards();
      if (Platform.OS === "web") {
        alert(result.message);
      } else {
        Alert.alert("Ergebnis", result.message);
      }
    } catch (error: any) {
      console.error("Failed to seed boards:", error);
      if (Platform.OS === "web") {
        alert("Fehler: " + error.message);
      } else {
        Alert.alert("Fehler", error.message);
      }
    }
  };

  if (boards === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B7355" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <Pressable style={styles.seedButton} onPress={handleSeedBoards}>
            <Text style={styles.seedButtonText}>Beispiele laden</Text>
          </Pressable>
          <Pressable style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Abmelden</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable
          style={styles.createButton}
          onPress={() => router.push("/admin/board-editor")}
        >
          <Text style={styles.createButtonText}>+ Neues Spielbrett</Text>
        </Pressable>

        {boards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Noch keine Spielbretter vorhanden.
            </Text>
            <Text style={styles.emptyHint}>
              Klicke auf "Beispiele laden" um Demo-Spielbretter zu erstellen.
            </Text>
          </View>
        ) : (
          <View style={styles.boardList}>
            {boards.map((board) => (
              <View key={board._id} style={styles.boardCard}>
                <View style={styles.boardHeader}>
                  <View>
                    <Text style={styles.boardDate}>
                      {board.date ? formatDate(board.date) : "Kein Datum"}
                    </Text>
                    <Text style={styles.boardId}>ID: {board._id}</Text>
                    <View style={styles.badgeRow}>
                      {board.isPastPool && (
                        <View style={styles.poolBadge}>
                          <Text style={styles.poolBadgeText}>Archiv</Text>
                        </View>
                      )}
                      {board.date === new Date().toISOString().split("T")[0] && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>Heute</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <Pressable
                      style={styles.testPlayButton}
                      onPress={() =>
                        router.push(`/game/test/${board._id}`)
                      }
                    >
                      <Text style={styles.testPlayButtonText}>Testen</Text>
                    </Pressable>
                    <Pressable
                      style={styles.editButton}
                      onPress={() =>
                        router.push({
                          pathname: "/admin/board-editor",
                          params: { boardId: board._id },
                        })
                      }
                    >
                      <Text style={styles.editButtonText}>Bearbeiten</Text>
                    </Pressable>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDelete(board._id)}
                      disabled={deletingId === board._id}
                    >
                      {deletingId === board._id ? (
                        <ActivityIndicator size="small" color="#FF6B6B" />
                      ) : (
                        <Text style={styles.deleteButtonText}>Löschen</Text>
                      )}
                    </Pressable>
                  </View>
                </View>

                <View style={styles.solutionContainer}>
                  {board.groups.map((group) => (
                    <View
                      key={group.name}
                      style={styles.solutionGroup}
                    >
                      <View
                        style={[
                          styles.groupHeader,
                          { backgroundColor: getDifficultyColor(group.difficulty) },
                        ]}
                      >
                        <Text style={styles.groupHeaderText}>{group.name}</Text>
                      </View>
                      <View style={styles.groupWords}>
                        <Text style={styles.wordText}>
                          {group.words.join(" • ")}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  seedButton: {
    backgroundColor: "#2A2A2A",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  seedButtonText: {
    color: "#CCCCCC",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#3A2020",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
  },
  createButton: {
    backgroundColor: "#8B7355",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    color: "#CCCCCC",
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  boardList: {
    gap: 16,
  },
  boardCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  boardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  boardDate: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  boardId: {
    fontSize: 11,
    color: "#666666",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  poolBadge: {
    backgroundColor: "#2A3A2A",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  poolBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7BC67B",
  },
  todayBadge: {
    backgroundColor: "#3A3A2A",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D4AF37",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  testPlayButton: {
    backgroundColor: "#2A4A2A",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  testPlayButtonText: {
    color: "#7BC67B",
    fontSize: 12,
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: "#2A2A2A",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editButtonText: {
    color: "#CCCCCC",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#3A2020",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 60,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "600",
  },
  solutionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  solutionGroup: {
    gap: 4,
    width: "48%",
    minWidth: 140,
  },
  groupHeader: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  groupHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1A1A1A",
    textTransform: "uppercase",
  },
  groupWords: {
    paddingLeft: 4,
  },
  wordText: {
    fontSize: 13,
    color: "#CCCCCC",
    lineHeight: 20,
  },
});

