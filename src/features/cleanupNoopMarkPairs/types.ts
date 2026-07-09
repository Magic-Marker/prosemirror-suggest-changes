import { type Node } from "prosemirror-model";

import { type SuggestionId } from "../../generateId.js";

export interface Range {
  from: number;
  to: number;
}

// used to represent a range of inline content inside a textblock node
export type TextblockRange = Range;

// represents a node of type text with it's starting and ending positions
export interface TextSegment {
  from: number;
  to: number;
  node: Node;
}

// a contigious sequence of either deletion or insertion marks, spread across text nodes
export interface SuggestionRun {
  kind: "deletion" | "insertion";
  id: SuggestionId;
  from: number;
  to: number;
  segments: TextSegment[];
}

// a contigious sequence of deletion then insertion marks
// a "deletion/insertion mark pair"
export interface SuggestionPair {
  deletion: SuggestionRun;
  insertion: SuggestionRun;
}
