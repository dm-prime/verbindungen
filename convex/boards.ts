import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// Get today's board
export const getTodaysBoard = query({
  args: {},
  handler: async (ctx) => {
    const today = getTodayDate();
    const board = await ctx.db
      .query("boards")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();
    return board;
  },
});

// Get a random past board from the pool
export const getRandomPastBoard = query({
  args: { excludeBoardIds: v.optional(v.array(v.id("boards"))) },
  handler: async (ctx, args) => {
    const pastBoards = await ctx.db
      .query("boards")
      .withIndex("by_past_pool", (q) => q.eq("isPastPool", true))
      .collect();

    // Filter out excluded boards
    const availableBoards = args.excludeBoardIds
      ? pastBoards.filter((b) => !args.excludeBoardIds!.includes(b._id))
      : pastBoards;

    if (availableBoards.length === 0) {
      return null;
    }

    // Return random board
    const randomIndex = Math.floor(Math.random() * availableBoards.length);
    return availableBoards[randomIndex];
  },
});

// Get board by ID
export const getBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.boardId);
  },
});

// List all boards (for admin)
export const listBoards = query({
  args: {},
  handler: async (ctx) => {
    const boards = await ctx.db.query("boards").order("desc").collect();
    return boards;
  },
});

// Create a new board
export const createBoard = mutation({
  args: {
    words: v.array(v.string()),
    groups: v.array(
      v.object({
        name: v.string(),
        words: v.array(v.string()),
        difficulty: v.union(
          v.literal("easy"),
          v.literal("medium"),
          v.literal("hard"),
          v.literal("very-hard")
        ),
      })
    ),
    date: v.optional(v.string()),
    isPastPool: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Validate that all words from groups are in the words array
    const allGroupWords = args.groups.flatMap((g) => g.words);
    if (allGroupWords.length !== 16) {
      throw new Error("Board must have exactly 16 words in groups");
    }

    const uniqueWords = new Set(allGroupWords);
    if (uniqueWords.size !== 16) {
      throw new Error("All words must be unique");
    }

    // Ensure words array matches groups
    const words = args.words.length === 16 ? args.words : allGroupWords;

    const boardId = await ctx.db.insert("boards", {
      words,
      groups: args.groups,
      date: args.date,
      isPastPool: args.isPastPool,
      createdAt: Date.now(),
    });

    return boardId;
  },
});

// Update a board
export const updateBoard = mutation({
  args: {
    boardId: v.id("boards"),
    words: v.optional(v.array(v.string())),
    groups: v.optional(
      v.array(
        v.object({
          name: v.string(),
          words: v.array(v.string()),
          difficulty: v.union(
            v.literal("easy"),
            v.literal("medium"),
            v.literal("hard"),
            v.literal("very-hard")
          ),
        })
      )
    ),
    date: v.optional(v.string()),
    isPastPool: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { boardId, ...updates } = args;
    const board = await ctx.db.get(boardId);

    if (!board) {
      throw new Error("Board not found");
    }

    // If groups are updated, validate them
    if (updates.groups) {
      const allGroupWords = updates.groups.flatMap((g) => g.words);
      if (allGroupWords.length !== 16) {
        throw new Error("Board must have exactly 16 words in groups");
      }

      const uniqueWords = new Set(allGroupWords);
      if (uniqueWords.size !== 16) {
        throw new Error("All words must be unique");
      }

      // Update words array to match groups
      updates.words = allGroupWords;
    }

    await ctx.db.patch(boardId, updates);
    return boardId;
  },
});

// Delete a board
export const deleteBoard = mutation({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.boardId);
    return { success: true };
  },
});

// Seed sample German boards
export const seedSampleBoards = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if boards already exist
    const existingBoards = await ctx.db.query("boards").first();
    if (existingBoards) {
      return { success: false, message: "Boards already exist" };
    }

    const today = new Date();
    const boards = [
      // Past boards (isPastPool: true)
      {
        date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        isPastPool: true,
        groups: [
          { name: "Deutsche Städte", words: ["BERLIN", "MÜNCHEN", "HAMBURG", "KÖLN"], difficulty: "easy" as const },
          { name: "Brotsorten", words: ["VOLLKORN", "ROGGEN", "WEIZEN", "PUMPERNICKEL"], difficulty: "medium" as const },
          { name: "Märchenfiguren", words: ["ROTKÄPPCHEN", "ASCHENPUTTEL", "RAPUNZEL", "SCHNEEWITTCHEN"], difficulty: "hard" as const },
          { name: "__ ZEIT", words: ["LEBENS", "SOMMER", "TEIL", "GUTEN"], difficulty: "very-hard" as const },
        ],
      },
      {
        date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        isPastPool: true,
        groups: [
          { name: "Farben", words: ["BLAU", "ROT", "GRÜN", "GELB"], difficulty: "easy" as const },
          { name: "Automarken aus Deutschland", words: ["VOLKSWAGEN", "BMW", "MERCEDES", "AUDI"], difficulty: "medium" as const },
          { name: "Klassische Komponisten", words: ["BACH", "BEETHOVEN", "BRAHMS", "WAGNER"], difficulty: "hard" as const },
          { name: "SCHLAG __", words: ["ZEUG", "KRAFT", "WORT", "FERTIG"], difficulty: "very-hard" as const },
        ],
      },
      {
        date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        isPastPool: true,
        groups: [
          { name: "Wochentage", words: ["MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG"], difficulty: "easy" as const },
          { name: "Gemüse", words: ["KAROTTE", "BROKKOLI", "SPINAT", "TOMATE"], difficulty: "medium" as const },
          { name: "Fußballvereine", words: ["BAYERN", "DORTMUND", "SCHALKE", "BREMEN"], difficulty: "hard" as const },
          { name: "__ MEISTER", words: ["BÜRGER", "WELT", "KAPELLEN", "BAND"], difficulty: "very-hard" as const },
        ],
      },
      {
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        isPastPool: true,
        groups: [
          { name: "Getränke", words: ["WASSER", "KAFFEE", "BIER", "WEIN"], difficulty: "easy" as const },
          { name: "Berge in den Alpen", words: ["ZUGSPITZE", "MATTERHORN", "EIGER", "JUNGFRAU"], difficulty: "medium" as const },
          { name: "Deutsche Dichter", words: ["GOETHE", "SCHILLER", "HEINE", "RILKE"], difficulty: "hard" as const },
          { name: "KINDER __", words: ["GARTEN", "WAGEN", "SPIEL", "LEICHT"], difficulty: "very-hard" as const },
        ],
      },
      {
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        isPastPool: true,
        groups: [
          { name: "Tiere", words: ["HUND", "KATZE", "VOGEL", "FISCH"], difficulty: "easy" as const },
          { name: "Währungen", words: ["EURO", "DOLLAR", "PFUND", "FRANKEN"], difficulty: "medium" as const },
          { name: "Deutsche Philosophen", words: ["KANT", "HEGEL", "NIETZSCHE", "MARX"], difficulty: "hard" as const },
          { name: "HAND __", words: ["SCHUH", "TUCH", "WERK", "LUNG"], difficulty: "very-hard" as const },
        ],
      },
      // Today and future boards
      {
        date: today.toISOString().split("T")[0],
        isPastPool: false,
        groups: [
          { name: "Jahreszeiten", words: ["FRÜHLING", "SOMMER", "HERBST", "WINTER"], difficulty: "easy" as const },
          { name: "Deutsche Flüsse", words: ["RHEIN", "DONAU", "ELBE", "MAIN"], difficulty: "medium" as const },
          { name: "Bundeskanzler", words: ["ADENAUER", "BRANDT", "KOHL", "MERKEL"], difficulty: "hard" as const },
          { name: "__ BAHN", words: ["AUTO", "EISEN", "RENN", "STRASSEN"], difficulty: "very-hard" as const },
        ],
      },
      {
        date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        isPastPool: false,
        groups: [
          { name: "Möbel", words: ["STUHL", "TISCH", "BETT", "SCHRANK"], difficulty: "easy" as const },
          { name: "Musikinstrumente", words: ["KLAVIER", "GEIGE", "GITARRE", "FLÖTE"], difficulty: "medium" as const },
          { name: "Deutsche Inseln", words: ["SYLT", "RÜGEN", "USEDOM", "HELGOLAND"], difficulty: "hard" as const },
          { name: "STEIN __", words: ["BRUCH", "BOCK", "ZEIT", "REICH"], difficulty: "very-hard" as const },
        ],
      },
      {
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        isPastPool: false,
        groups: [
          { name: "Obst", words: ["APFEL", "BIRNE", "TRAUBE", "KIRSCHE"], difficulty: "easy" as const },
          { name: "Sportarten", words: ["FUSSBALL", "TENNIS", "SCHWIMMEN", "LAUFEN"], difficulty: "medium" as const },
          { name: "Wissenschaftler", words: ["EINSTEIN", "PLANCK", "HEISENBERG", "RÖNTGEN"], difficulty: "hard" as const },
          { name: "FEUER __", words: ["WEHR", "WERK", "ZEUG", "PROBE"], difficulty: "very-hard" as const },
        ],
      },
      {
        date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        isPastPool: false,
        groups: [
          { name: "Kleidung", words: ["HEMD", "HOSE", "JACKE", "MANTEL"], difficulty: "easy" as const },
          { name: "Berufe", words: ["ARZT", "LEHRER", "BÄCKER", "RICHTER"], difficulty: "medium" as const },
          { name: "Opern", words: ["FIDELIO", "FREISCHÜTZ", "LOHENGRIN", "ROSENKAVALIER"], difficulty: "hard" as const },
          { name: "WUNDER __", words: ["BAR", "KIND", "LAND", "SCHÖN"], difficulty: "very-hard" as const },
        ],
      },
      {
        date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        isPastPool: false,
        groups: [
          { name: "Körperteile", words: ["KOPF", "ARM", "BEIN", "HAND"], difficulty: "easy" as const },
          { name: "Materialien", words: ["HOLZ", "METALL", "GLAS", "STEIN"], difficulty: "medium" as const },
          { name: "Burgen/Schlösser", words: ["NEUSCHWANSTEIN", "HEIDELBERG", "WARTBURG", "SANSSOUCI"], difficulty: "hard" as const },
          { name: "NACH __", words: ["RICHT", "AHMEN", "DENKEN", "MITTAG"], difficulty: "very-hard" as const },
        ],
      },
    ];

    // Insert all boards
    for (const board of boards) {
      const allWords = board.groups.flatMap((g) => g.words);
      await ctx.db.insert("boards", {
        words: allWords,
        groups: board.groups,
        date: board.date,
        isPastPool: board.isPastPool,
        createdAt: Date.now(),
      });
    }

    return { success: true, message: `Created ${boards.length} sample boards` };
  },
});
