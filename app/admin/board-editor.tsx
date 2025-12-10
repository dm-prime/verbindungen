import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getDifficultyColor, getDifficultyLabel, Difficulty } from "@/utils/gameLogic";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "very-hard"];

interface GroupInput {
  name: string;
  words: string[];
  difficulty: Difficulty;
}

const emptyGroup = (difficulty: Difficulty): GroupInput => ({
  name: "",
  words: ["", "", "", ""],
  difficulty,
});

export default function BoardEditorScreen() {
  const router = useRouter();
  const { boardId } = useLocalSearchParams<{ boardId?: string }>();
  const isEditing = !!boardId;

  const existingBoard = useQuery(
    api.boards.getBoard,
    boardId ? { boardId: boardId as Id<"boards"> } : "skip"
  );

  const createBoard = useMutation(api.boards.createBoard);
  const updateBoard = useMutation(api.boards.updateBoard);

  const [groups, setGroups] = useState<GroupInput[]>(
    DIFFICULTIES.map((d) => emptyGroup(d))
  );
  const [date, setDate] = useState("");
  const [isPastPool, setIsPastPool] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing board data
  useEffect(() => {
    if (existingBoard) {
      setGroups(
        existingBoard.groups.map((g) => ({
          name: g.name,
          words: [...g.words],
          difficulty: g.difficulty,
        }))
      );
      setDate(existingBoard.date || "");
      setIsPastPool(existingBoard.isPastPool);
    }
  }, [existingBoard]);

  const updateGroup = (index: number, field: keyof GroupInput, value: any) => {
    setGroups((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateGroupWord = (groupIndex: number, wordIndex: number, value: string) => {
    setGroups((prev) => {
      const updated = [...prev];
      const words = [...updated[groupIndex].words];
      words[wordIndex] = value.toUpperCase();
      updated[groupIndex] = { ...updated[groupIndex], words };
      return updated;
    });
  };

  const validate = (): string | null => {
    // Check all groups have names
    for (const group of groups) {
      if (!group.name.trim()) {
        return "Alle Gruppen müssen einen Namen haben";
      }
    }

    // Check all words are filled
    const allWords: string[] = [];
    for (const group of groups) {
      for (const word of group.words) {
        if (!word.trim()) {
          return "Alle Wörter müssen ausgefüllt sein";
        }
        allWords.push(word.trim().toUpperCase());
      }
    }

    // Check for unique words
    const uniqueWords = new Set(allWords);
    if (uniqueWords.size !== 16) {
      return "Alle 16 Wörter müssen unterschiedlich sein";
    }

    // Validate date format if provided
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return "Datum muss im Format JJJJ-MM-TT sein";
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const boardData = {
        words: groups.flatMap((g) => g.words.map((w) => w.trim().toUpperCase())),
        groups: groups.map((g) => ({
          name: g.name.trim(),
          words: g.words.map((w) => w.trim().toUpperCase()),
          difficulty: g.difficulty,
        })),
        date: date || undefined,
        isPastPool,
      };

      if (isEditing) {
        await updateBoard({
          boardId: boardId as Id<"boards">,
          ...boardData,
        });
      } else {
        await createBoard(boardData);
      }

      router.back();
    } catch (err: any) {
      setError(err.message || "Speichern fehlgeschlagen");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && existingBoard === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B7355" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Date input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datum (optional)</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="JJJJ-MM-TT (z.B. 2025-12-25)"
          placeholderTextColor="#666666"
        />
      </View>

      {/* Past pool toggle */}
      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleLabel}>Archiv-Pool</Text>
          <Text style={styles.toggleHint}>
            Aktivieren für zufällige Archivspiele
          </Text>
        </View>
        <Switch
          value={isPastPool}
          onValueChange={setIsPastPool}
          trackColor={{ false: "#3A3A3A", true: "#5A7355" }}
          thumbColor={isPastPool ? "#8B7355" : "#666666"}
        />
      </View>

      {/* Groups */}
      <View style={styles.groupsGrid}>
        {groups.map((group, groupIndex) => (
          <View
            key={groupIndex}
            style={[
              styles.groupCard,
              { borderLeftColor: getDifficultyColor(group.difficulty) },
            ]}
          >
            <View style={styles.groupHeader}>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(group.difficulty) },
                ]}
              >
                <Text style={styles.difficultyBadgeText}>
                  {getDifficultyLabel(group.difficulty)}
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Gruppenname</Text>
            <TextInput
              style={styles.input}
              value={group.name}
              onChangeText={(value) => updateGroup(groupIndex, "name", value)}
              placeholder="z.B. Deutsche Städte"
              placeholderTextColor="#666666"
            />

            <Text style={styles.inputLabel}>Wörter (4 Stück)</Text>
            <View style={styles.wordsGrid}>
              {group.words.map((word, wordIndex) => (
                <TextInput
                  key={wordIndex}
                  style={styles.wordInput}
                  value={word}
                  onChangeText={(value) =>
                    updateGroupWord(groupIndex, wordIndex, value)
                  }
                  placeholder={`Wort ${wordIndex + 1}`}
                  placeholderTextColor="#666666"
                  autoCapitalize="characters"
                />
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Save button */}
      <Pressable
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>
            {isEditing ? "Änderungen speichern" : "Spielbrett erstellen"}
          </Text>
        )}
      </Pressable>

      {/* Cancel button */}
      <Pressable style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelButtonText}>Abbrechen</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#CCCCCC",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  toggleHint: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  groupsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  groupCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    width: "48%",
    minWidth: 160,
  },
  groupHeader: {
    marginBottom: 16,
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  difficultyBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1A1A",
    textTransform: "uppercase",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999999",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  wordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  wordInput: {
    backgroundColor: "#2A2A2A",
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: "#FFFFFF",
    width: "48%",
    textTransform: "uppercase",
  },
  errorContainer: {
    backgroundColor: "#4A2020",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#8B7355",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    backgroundColor: "transparent",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  cancelButtonText: {
    color: "#999999",
    fontSize: 16,
    fontWeight: "600",
  },
});

