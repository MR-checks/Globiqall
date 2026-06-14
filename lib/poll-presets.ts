/**
 * Curated option templates for the create-poll form.
 * Click → fills the poll option fields. Saves users from cold-start blank-page paralysis.
 */

export type PresetOption = { label: string; emoji?: string };

export type Preset = {
  id: string;
  name: string;
  options: PresetOption[];
};

export const BINARY_PRESETS: Preset[] = [
  {
    id: "yes-no",
    name: "Yes / No",
    options: [
      { label: "Yes", emoji: "👍" },
      { label: "No", emoji: "👎" },
    ],
  },
  {
    id: "agree-disagree",
    name: "Agree / Disagree",
    options: [
      { label: "Agree", emoji: "✅" },
      { label: "Disagree", emoji: "❌" },
    ],
  },
  {
    id: "bull-bear",
    name: "Bull / Bear",
    options: [
      { label: "Bullish", emoji: "🐂" },
      { label: "Bearish", emoji: "🐻" },
    ],
  },
  {
    id: "hot-not",
    name: "Hot / Not",
    options: [
      { label: "Hot", emoji: "🔥" },
      { label: "Not", emoji: "❄️" },
    ],
  },
  {
    id: "pro-con",
    name: "Pro / Con",
    options: [
      { label: "Pro", emoji: "➕" },
      { label: "Con", emoji: "➖" },
    ],
  },
];

export const MULTI_PRESETS: Preset[] = [
  {
    id: "rating",
    name: "Hit / Mid / Miss",
    options: [
      { label: "Hit", emoji: "🎯" },
      { label: "Mid", emoji: "🟡" },
      { label: "Miss", emoji: "❌" },
    ],
  },
  {
    id: "tier",
    name: "S / A / B / C tier",
    options: [
      { label: "S-tier", emoji: "🏆" },
      { label: "A-tier", emoji: "🥇" },
      { label: "B-tier", emoji: "🥈" },
      { label: "C-tier", emoji: "🥉" },
    ],
  },
  {
    id: "vibes",
    name: "Vibe check",
    options: [
      { label: "Love it", emoji: "💯" },
      { label: "Decent", emoji: "👍" },
      { label: "Meh", emoji: "😐" },
      { label: "Hate it", emoji: "💀" },
    ],
  },
  {
    id: "when",
    name: "Timeline",
    options: [
      { label: "Already here", emoji: "⏰" },
      { label: "This year", emoji: "📅" },
      { label: "This decade", emoji: "🗓️" },
      { label: "Never", emoji: "♾️" },
    ],
  },
  {
    id: "frequency",
    name: "How often",
    options: [
      { label: "Daily", emoji: "🌅" },
      { label: "Weekly", emoji: "📆" },
      { label: "Sometimes", emoji: "🌗" },
      { label: "Never", emoji: "🚫" },
    ],
  },
];

/** Example questions shown in the How-it-works guide as cold-start inspiration. */
export const QUESTION_STARTERS: string[] = [
  "Will [X] happen by [year]?",
  "Best [X] of all time?",
  "[X] or [Y]?",
  "Should [group] [action]?",
];
