export {
  addSuggestionMarks,
  insertion,
  deletion,
  modification,
  hiddenDeletion,
} from "./schema.js";

export {
  selectSuggestion,
  revertSuggestion,
  revertSuggestions,
  applySuggestion,
  applySuggestions,
  enableSuggestChanges,
  disableSuggestChanges,
  toggleSuggestChanges,
} from "./commands.js";

export {
  suggestChanges,
  suggestChangesKey,
  isSuggestChangesEnabled,
} from "./plugin.js";

export {
  withSuggestChanges,
  transformToSuggestionTransaction,
} from "./withSuggestChanges.js";

export {
  ensureSelection as experimental_ensureSelection,
  ensureSelectionKey as experimental_ensureSelectionKey,
  isEnsureSelectionEnabled as experimental_isEnsureSelectionEnabled,
} from "./ensureSelectionPlugin.js";
