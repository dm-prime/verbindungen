---
name: Puzzle Generation Process Documentation
overview: Create comprehensive documentation outlining a multi-step LLM prompting methodology for generating difficult "ass-backwards" word grouping puzzles like the Zalando example, with strategies for creating misleading connections, multiple meanings, and varying difficulty levels.
todos: []
---

# Puzzle Generation Process Documentation

## Overview

Document a step-by-step LLM prompting methodology for generating difficult German word grouping puzzles that require domain knowledge, exploit multiple meanings, and use compound word patterns to create misleading connections.

## Structure

### 1. Analysis Section

- Document the characteristics of "ass-backwards" puzzles:
- Requiring specific cultural/domain knowledge (e.g., ZALANDO brand)
- Words with multiple meanings/contexts (e.g., SEXSTELLUNGEN - innocent words that are also sex positions)
- Compound word patterns (e.g., __AUTOMAT requiring knowledge of German compound formation)
- Red herrings (words that could plausibly fit multiple categories)
- Difficulty progression: easy → medium → hard → very-hard

### 2. Multi-Step Prompting Process

Document a 5-7 step iterative process:

**Step 1: Theme & Difficulty Planning**

- Prompt LLM to generate 4 group themes with varying difficulty strategies
- Include examples of each difficulty type
- Require at least one group requiring domain knowledge
- Require at least one group using multiple meanings

**Step 2: Word Selection & Ambiguity**

- For each group, prompt LLM to generate candidate words
- Require words that could plausibly fit 2+ categories
- Include instructions for finding words with double meanings
- Generate more candidates than needed (6-8 per group)

**Step 3: Cross-Category Validation**

- Prompt LLM to verify each word could plausibly belong to multiple groups
- Identify and strengthen red herrings
- Ensure no word is obviously only one category

**Step 4: Compound Word Pattern Generation**

- For groups using compound patterns (like __AUTOMAT), prompt LLM to:
- Verify all words form valid, commonly-used compounds
- Ensure the pattern isn't too obvious
- Check for alternative valid compounds that could mislead
- **CRITICAL CHECKS:**
  - Avoid genitive forms ending in -s (LEBENS, ARBEITS) - too obvious
  - Avoid obvious pairs/opposites (TEIL/VOLL) - makes pattern too clear
  - Verify compounds are actually used in German (not just theoretically possible)
  - Prefer standalone words that don't obviously indicate compound membership
  - Test: "Does this word look like it could stand alone in another category?"

**Step 5: Final Assembly & Difficulty Assignment**

- Prompt LLM to assign difficulty levels based on:
- Obviousness of connection
- Required knowledge domain
- Pattern recognition difficulty
- Validate 16 unique words total
- **Difficulty Assessment Guidelines:**
  - Easy: Common knowledge that most German speakers know (e.g., card suits, basic vocabulary)
  - Medium: Requires some pattern recognition or domain knowledge (e.g., German cities, common themes)
  - Hard: Requires specialized knowledge or complex pattern recognition (e.g., compound word patterns, less obvious connections)
  - Very-Hard: Requires obscure knowledge, multiple meanings, or non-obvious patterns (e.g., brand names, adult terminology, complex polysemy)
  - **Test question**: "Would a typical German speaker know this without specialized knowledge?"

**Step 6: Quality Check**

- Prompt LLM to solve the puzzle as a fresh solver
- Identify if any groups are too easy or too hard
- Suggest refinements

**Step 7: Iteration & Refinement**

- Loop back to earlier steps if quality check fails
- Document common failure modes and fixes

### 3. Prompt Templates

- Provide example prompts for each step
- Include system prompts for role-playing (e.g., "You are a German language puzzle designer")
- Show example inputs/outputs for each step

### 4. Example Walkthrough

- Complete example using the Zalando puzzle
- Show intermediate outputs at each step
- Explain why certain choices were made

### 5. Advanced Strategies

- Techniques for creating particularly devious puzzles:
- Using brand names/companies
- Exploiting homonyms and polysemy
- Compound word edge cases
- Cultural references
- Technical/specialized vocabulary

### 6. Validation Checklist

- List of criteria to verify puzzle quality:
- All words are valid German words
- Each group has exactly 4 words
- No word appears twice
- Difficulty progression is appropriate
- Multiple plausible groupings exist (red herrings)
- Solution is unambiguous once found

### 7. Lessons Learned & Common Pitfalls

- **Difficulty Assessment Errors:**
  - Common knowledge (e.g., card game terms ASS, BUBE, DAME, KÖNIG) should be "easy", not "very-hard"
  - Very-hard should require obscure or specialized knowledge, not general knowledge
  - Test difficulty by asking: "Would a typical German speaker know this?"

- **Compound Word Pitfalls:**
  - **CRITICAL: All words MUST be valid standalone German words** (e.g., WOHN is NOT valid - it's just a stem; use KAUF, SPIEL, RAT instead)
  - Avoid genitive forms ending in -s (e.g., LEBENS, ARBEITS) - they're too obvious as compound parts
  - Avoid words that form uncommon/rare compounds (e.g., GUTENZEIT, NACHTZEIT)
  - Avoid obvious pairs/opposites in the same group (e.g., TEIL/VOLL, SOMMER/WINTER) - makes pattern too obvious
  - Verify all compounds are commonly used German words
  - Prefer standalone words that don't obviously indicate they're part of a compound
  - **Test each word:** "Can I find this word in a dictionary as a standalone entry?" If no, it's invalid

- **Word Selection Guidelines:**
  - Words should be ambiguous enough to fit multiple categories
  - Avoid words that are clearly only one category
  - Test each word: "Could this plausibly fit another group?"
  - Seasonal pairs (SOMMER/WINTER) can work if other words break the pattern

- **CRITICAL: Avoid "List Categories" - The Spielkarten/Sportmarken Problem:**
  - **What are list categories?** Groups where words are simply members of a well-known list (playing cards, sports brands, months, weekdays, etc.)
  - **Why they're terrible:**
    1. **Zero ambiguity:** Words like ADIDAS, PUMA, NIKE, REEBOK can ONLY be sports brands - they can't plausibly fit any other category
    2. **No red herrings:** Once you identify one word (e.g., NIKE), you immediately know all others in that category
    3. **Trivial difficulty:** Despite being marked "very-hard", these are actually the EASIEST to solve
    4. **Breaks the puzzle:** Removes 4 words from consideration immediately, making remaining groups too easy
    5. **Not "ass-backwards":** There's no clever misdirection, no multiple meanings, no domain knowledge required beyond "I know brand names"
  - **Examples of bad list categories:**
    - Spielkarten: ASS, BUBE, DAME, KÖNIG (playing cards)
    - Sportmarken: ADIDAS, PUMA, NIKE, REEBOK (sports brands)
    - Monate: JANUAR, FEBRUAR, MÄRZ, APRIL (months)
    - Wochentage: MONTAG, DIENSTAG, MITTWOCH, DONNERSTAG (weekdays)
  - **How to fix them:**
    - Replace with categories that use **polysemy** (words with multiple meanings)
    - Example: Instead of "Spielkarten", use words like DAME, KÖNIG that could ALSO be titles, chess pieces, or other contexts
    - Example: Instead of "Sportmarken", use words like PUMA, JAGUAR that could be animals OR brands
    - The key: Every word should have at least 2-3 plausible interpretations
  - **Test question:** "If I remove this word from the puzzle, could it plausibly belong to 2+ different categories?" If no, it's probably a list category word.

## Files to Create

1. `docs/puzzle-generation-process.md` - Main documentation file with the complete methodology

## Implementation Notes

- This is documentation only, no code changes needed
- Focus on providing actionable prompt templates that can be copy-pasted
- Include both English and German examples where relevant
- Make it clear this is a creative/iterative process, not deterministic