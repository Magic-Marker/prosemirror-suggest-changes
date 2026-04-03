export {
  addSuggestionMarks,
  insertion,
  deletion,
  modification,
  hiddenDeletion,
  structure,
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

export {
  stableNodeIds as experimental_stableNodeIds,
  stableNodeIdsKey as experimental_stableNodeIdsKey,
} from "./features/wrapUnwrap/stableNodeIdsPlugin.js";

export {
  structureChangesPlugin as experimental_structureChangesPlugin,
  structureChangesKey as experimental_structureChangesKey,
} from "./features/wrapUnwrap/structureChangesPlugin.js";
