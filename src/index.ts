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
  suggestStructureChanges as experimental_suggestStructureChanges,
} from "./withSuggestChanges.js";

export {
  ensureSelection as experimental_ensureSelection,
  ensureSelectionKey as experimental_ensureSelectionKey,
  isEnsureSelectionEnabled as experimental_isEnsureSelectionEnabled,
} from "./features/ensureValidSelection/ensureSelectionPlugin.js";

export { guardStructureMarkAttrs } from "./features/wrapUnwrap/types.js";

export type {
  Op as StructureOp,
  StructureMarkAttrs,
  StructuralContextPath,
} from "./features/wrapUnwrap/types.js";

export { wrappingInputRule as experimental_wrappingInputRule } from "./wrappingInputRule.js";
