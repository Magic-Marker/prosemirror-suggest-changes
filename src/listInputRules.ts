import { type NodeType } from "prosemirror-model";
import { wrappingInputRule } from "./wrappingInputRule.js";
import { ZWSP } from "./constants.js";

export function listInputRules(
  bulletListNodeType: NodeType,
  orderedListNodeType: NodeType,
) {
  const bulletListInputRule = wrappingInputRule(
    // ^ string start, [${ZWSP}\\s]* zero or more ZWSP or whitespace, ([-+*]) one of -+* , \\s one whitespace, $ end of string
    // "u" flag treats \u as unicode code points instead of literal "u"
    new RegExp(`^[${ZWSP}\\s]*([-+*])\\s$`, "u"),
    bulletListNodeType,
  );
  // ^ string start, [${ZWSP}\\s]* zero or more ZWSP or whitespace, ([0-9]+\\.) digit followed by dot, \\s one whitespace, $ end of string
  // "u" flag treats \u as unicode code points instead of literal "u"
  const orderedListInputRule = wrappingInputRule(
    new RegExp(`^[${ZWSP}\\s]*([0-9]+\\.)\\s$`, "u"),
    orderedListNodeType,
  );

  return [bulletListInputRule, orderedListInputRule];
}
