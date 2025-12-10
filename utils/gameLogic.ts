export type Difficulty = "easy" | "medium" | "hard" | "very-hard";

export interface Group {
  name: string;
  words: string[];
  difficulty: Difficulty;
}

export interface Board {
  _id: string;
  words: string[];
  groups: Group[];
  date?: string;
  isPastPool: boolean;
  createdAt: number;
}

export interface GameState {
  remainingWords: string[];
  solvedGroups: Group[];
  selectedWords: string[];
  mistakesRemaining: number;
  isComplete: boolean;
  won: boolean;
  attempts: { words: string[]; correct: boolean }[];
}

export const MAX_MISTAKES = 4;
export const WORDS_PER_GROUP = 4;

// Fisher-Yates shuffle algorithm
export function shuffleWords<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Check if selected words match any group
export function checkGroup(
  selectedWords: string[],
  groups: Group[]
): { match: Group | null; isClose: boolean } {
  if (selectedWords.length !== WORDS_PER_GROUP) {
    return { match: null, isClose: false };
  }

  const selectedSet = new Set(selectedWords);

  for (const group of groups) {
    const groupSet = new Set(group.words);
    const matchCount = selectedWords.filter((w) => groupSet.has(w)).length;

    if (matchCount === WORDS_PER_GROUP) {
      return { match: group, isClose: false };
    }

    // Check if 3 out of 4 words match (close guess)
    if (matchCount === 3) {
      return { match: null, isClose: true };
    }
  }

  return { match: null, isClose: false };
}

// Create initial game state from a board
export function createGameState(board: Board): GameState {
  return {
    remainingWords: shuffleWords(board.words),
    solvedGroups: [],
    selectedWords: [],
    mistakesRemaining: MAX_MISTAKES,
    isComplete: false,
    won: false,
    attempts: [],
  };
}

// Process a guess and return new game state
export function processGuess(
  state: GameState,
  groups: Group[]
): GameState {
  const { selectedWords, remainingWords, solvedGroups, mistakesRemaining, attempts } = state;

  if (selectedWords.length !== WORDS_PER_GROUP) {
    return state;
  }

  // Find unsolved groups
  const solvedGroupNames = new Set(solvedGroups.map((g) => g.name));
  const unsolvedGroups = groups.filter((g) => !solvedGroupNames.has(g.name));

  const { match, isClose } = checkGroup(selectedWords, unsolvedGroups);
  const newAttempts = [...attempts, { words: [...selectedWords], correct: match !== null }];

  if (match) {
    // Correct guess
    const newSolvedGroups = [...solvedGroups, match];
    const newRemainingWords = remainingWords.filter(
      (w) => !selectedWords.includes(w)
    );
    const isComplete = newSolvedGroups.length === groups.length;

    return {
      remainingWords: newRemainingWords,
      solvedGroups: newSolvedGroups,
      selectedWords: [],
      mistakesRemaining,
      isComplete,
      won: isComplete,
      attempts: newAttempts,
    };
  } else {
    // Wrong guess - keep words selected so user can try again
    const newMistakes = mistakesRemaining - 1;
    const isComplete = newMistakes === 0;

    return {
      ...state,
      // Keep selectedWords from state (don't clear them)
      mistakesRemaining: newMistakes,
      isComplete,
      won: false,
      attempts: newAttempts,
    };
  }
}

// Toggle word selection
export function toggleWordSelection(
  state: GameState,
  word: string
): GameState {
  const { selectedWords } = state;

  if (selectedWords.includes(word)) {
    return {
      ...state,
      selectedWords: selectedWords.filter((w) => w !== word),
    };
  }

  if (selectedWords.length >= WORDS_PER_GROUP) {
    return state;
  }

  return {
    ...state,
    selectedWords: [...selectedWords, word],
  };
}

// Clear selection
export function clearSelection(state: GameState): GameState {
  return {
    ...state,
    selectedWords: [],
  };
}

// Shuffle remaining words
export function shuffleRemainingWords(state: GameState): GameState {
  return {
    ...state,
    remainingWords: shuffleWords(state.remainingWords),
  };
}

// Get difficulty color
export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case "easy":
      return "#F9DF6D"; // Yellow
    case "medium":
      return "#A0C35A"; // Green
    case "hard":
      return "#B0C4EF"; // Blue
    case "very-hard":
      return "#BA81C5"; // Purple
  }
}

// Get difficulty label in German
export function getDifficultyLabel(difficulty: Difficulty): string {
  switch (difficulty) {
    case "easy":
      return "Leicht";
    case "medium":
      return "Mittel";
    case "hard":
      return "Schwer";
    case "very-hard":
      return "Sehr schwer";
  }
}

// Format date for display
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "Zufall";
  
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format timestamp for display
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
