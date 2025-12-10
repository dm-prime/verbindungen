import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  GameState,
  Group,
  createGameState,
  processGuess,
  toggleWordSelection,
  clearSelection,
  shuffleRemainingWords,
  checkGroup,
  WORDS_PER_GROUP,
} from "@/utils/gameLogic";
import { useUser } from "@/contexts/UserContext";

const GAME_STATE_PREFIX = "verbindungen_game_";

interface Board {
  _id: Id<"boards">;
  words: string[];
  groups: Group[];
  date?: string;
  isPastPool: boolean;
  createdAt: number;
}

interface UseGameResult {
  gameState: GameState | null;
  board: Board | null;
  isLoading: boolean;
  hasPlayed: boolean;
  previousResult: {
    won: boolean;
    attempts: number;
    selectedGroups: { words: string[]; correct: boolean }[];
  } | null;
  selectWord: (word: string) => void;
  submitGuess: () => { success: boolean; isClose: boolean };
  deselectAll: () => void;
  shuffle: () => void;
}

// Helper to get storage key for a board
function getStorageKey(boardId: string): string {
  return `${GAME_STATE_PREFIX}${boardId}`;
}

// Save game state to storage
async function saveGameState(boardId: string, state: GameState): Promise<void> {
  try {
    await AsyncStorage.setItem(getStorageKey(boardId), JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save game state:", error);
  }
}

// Load game state from storage
async function loadGameState(boardId: string): Promise<GameState | null> {
  try {
    const saved = await AsyncStorage.getItem(getStorageKey(boardId));
    if (saved) {
      return JSON.parse(saved) as GameState;
    }
  } catch (error) {
    console.error("Failed to load game state:", error);
  }
  return null;
}

// Clear game state from storage
async function clearGameState(boardId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(getStorageKey(boardId));
  } catch (error) {
    console.error("Failed to clear game state:", error);
  }
}

export function useGame(boardId: Id<"boards"> | null, testMode: boolean = false): UseGameResult {
  const { userId } = useUser();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const initialized = useRef(false);

  const board = useQuery(
    api.boards.getBoard,
    boardId ? { boardId } : "skip"
  );

  const hasPlayedQuery = useQuery(
    api.gameHistory.hasPlayedBoard,
    boardId && userId ? { userId, boardId } : "skip"
  );

  const previousResultQuery = useQuery(
    api.gameHistory.getGameResult,
    boardId && userId ? { userId, boardId } : "skip"
  );

  const recordGame = useMutation(api.gameHistory.recordGame);

  // Initialize game state when board loads - check for saved state first
  useEffect(() => {
    if (!board) return;
    
    // In test mode, skip checking hasPlayedQuery
    if (!testMode && hasPlayedQuery === undefined) return;
    if (!testMode && hasPlayedQuery) {
      setIsLoadingState(false);
      return;
    }

    // Prevent double initialization
    if (initialized.current && gameState) return;

    async function initializeGame() {
      initialized.current = true;
      
      if (testMode) {
        // In test mode, always create a fresh game state
        setGameState(createGameState(board as Board));
      } else {
        // Try to load saved state
        const savedState = await loadGameState(board!._id);
        
        if (savedState && !savedState.isComplete) {
          // Restore saved state
          setGameState(savedState);
        } else {
          // Create new game
          setGameState(createGameState(board as Board));
        }
      }
      setIsLoadingState(false);
    }

    initializeGame();
  }, [board, hasPlayedQuery, testMode]);

  // Reset initialized ref when board changes
  useEffect(() => {
    initialized.current = false;
    setIsLoadingState(true);
  }, [boardId]);

  // Save game state whenever it changes (but not on initial load)
  useEffect(() => {
    // Skip persistence in test mode
    if (testMode) return;
    
    if (gameState && boardId && !isLoadingState) {
      if (gameState.isComplete) {
        // Clear saved state when game is complete
        clearGameState(boardId);
      } else {
        // Save current state
        saveGameState(boardId, gameState);
      }
    }
  }, [gameState, boardId, isLoadingState, testMode]);

  const selectWord = useCallback((word: string) => {
    setGameState((current) => {
      if (!current || current.isComplete) return current;
      return toggleWordSelection(current, word);
    });
  }, []);

  const submitGuess = useCallback((): { success: boolean; isClose: boolean } => {
    if (!gameState || !board || gameState.selectedWords.length !== WORDS_PER_GROUP) {
      return { success: false, isClose: false };
    }

    // Check if guess is close before processing
    const solvedGroupNames = new Set(gameState.solvedGroups.map((g) => g.name));
    const unsolvedGroups = (board.groups as Group[]).filter(
      (g) => !solvedGroupNames.has(g.name)
    );
    const { match, isClose } = checkGroup(gameState.selectedWords, unsolvedGroups);

    const newState = processGuess(gameState, board.groups as Group[]);
    setGameState(newState);

    // Save game when complete (skip in test mode)
    if (newState.isComplete && userId && !testMode) {
      recordGame({
        userId,
        boardId: board._id,
        won: newState.won,
        attempts: newState.attempts.length,
        selectedGroups: newState.attempts,
      }).catch(console.error);
    }

    return { success: match !== null, isClose };
  }, [gameState, board, userId, recordGame]);

  const deselectAll = useCallback(() => {
    setGameState((current) => {
      if (!current) return current;
      return clearSelection(current);
    });
  }, []);

  const shuffle = useCallback(() => {
    setGameState((current) => {
      if (!current) return current;
      return shuffleRemainingWords(current);
    });
  }, []);

  return {
    gameState,
    board: board as Board | null,
    isLoading: board === undefined || (!testMode && hasPlayedQuery === undefined) || isLoadingState,
    hasPlayed: testMode ? false : (hasPlayedQuery ?? false),
    previousResult: testMode ? null : (previousResultQuery
      ? {
          won: previousResultQuery.won,
          attempts: previousResultQuery.attempts,
          selectedGroups: previousResultQuery.selectedGroups,
        }
      : null),
    selectWord,
    submitGuess,
    deselectAll,
    shuffle,
  };
}

// Hook to get today's board
export function useTodaysGame() {
  const { userId } = useUser();
  const todaysBoard = useQuery(api.boards.getTodaysBoard);
  
  const boardId = todaysBoard?._id ?? null;
  const game = useGame(boardId);

  // If there's no board for today, don't wait for game loading
  const noBoardToday = todaysBoard === null;
  const isLoading = todaysBoard === undefined || (!noBoardToday && game.isLoading);

  return {
    ...game,
    isLoading,
    noBoardToday,
  };
}

// Hook to get a random past game
export function useRandomGame() {
  const { userId } = useUser();
  const [currentBoardId, setCurrentBoardId] = useState<Id<"boards"> | null>(null);
  
  const playedBoardIds = useQuery(
    api.gameHistory.getPlayedBoardIds,
    userId ? { userId } : "skip"
  );

  const randomBoard = useQuery(
    api.boards.getRandomPastBoard,
    playedBoardIds !== undefined
      ? { excludeBoardIds: playedBoardIds }
      : "skip"
  );

  // Set initial board
  useEffect(() => {
    if (randomBoard && !currentBoardId) {
      setCurrentBoardId(randomBoard._id);
    }
  }, [randomBoard, currentBoardId]);

  const game = useGame(currentBoardId);

  const getNewRandomBoard = useCallback(() => {
    // Clear current board to trigger new random selection
    setCurrentBoardId(null);
  }, []);

  return {
    ...game,
    isLoading: playedBoardIds === undefined || randomBoard === undefined || game.isLoading,
    noPastBoards: randomBoard === null,
    getNewRandomBoard,
  };
}
