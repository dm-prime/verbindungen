import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
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

export function useGame(boardId: Id<"boards"> | null): UseGameResult {
  const { userId } = useUser();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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

  // Initialize game state when board loads
  useEffect(() => {
    if (board && !hasPlayedQuery) {
      setGameState(createGameState(board as Board));
    }
  }, [board, hasPlayedQuery]);

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

    // Save game when complete
    if (newState.isComplete && userId) {
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
    isLoading: board === undefined || hasPlayedQuery === undefined,
    hasPlayed: hasPlayedQuery ?? false,
    previousResult: previousResultQuery
      ? {
          won: previousResultQuery.won,
          attempts: previousResultQuery.attempts,
          selectedGroups: previousResultQuery.selectedGroups,
        }
      : null,
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
