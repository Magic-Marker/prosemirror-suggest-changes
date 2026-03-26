import { type Node, type NodeRange } from "prosemirror-model";

export type MatchingNodeSide = "start" | "innerStart" | "end" | "innerEnd";

export function findMatchingNodeSides(
  doc: Node,
  range: NodeRange,
  positions: { from: number; to: number },
) {
  // we make 2 passes
  // we visit every node in range, and look at its starting (startPos) and inner starting (innerStartPos) positions
  // (starting - at the start of the node, outside of it, inner starting - inside the node right after its opening token)
  // we see if "from" and/or "to" match "startPos" or "innerStartPos"
  // (if "from" matches "startPos" or "innerStartPos", we quickly check if "to" matches "endPos" or "innerEndPos",
  //     this prioritizes the best case scenario when both "from" and "to" are located at the same node)
  // second pass we visit every node in range and look at its ending positions in the similar fashion

  let fromSide = null as MatchingNodeSide | null;
  let toSide = null as MatchingNodeSide | null;

  let fromNode = null as Node | null;
  let toNode = null as Node | null;

  let fromPos = null as number | null;
  let toPos = null as number | null;

  doc.nodesBetween(range.start, range.end, (node, pos) => {
    if (node.isInline) return true;

    const startPos = pos;
    const innerStartPos = pos + 1;

    // is from at startPos?
    if (fromSide === null && startPos === positions.from) {
      fromSide = "start";
      fromNode = node;
      fromPos = pos;
    }

    // is from at innerStart pos?
    if (fromSide === null && innerStartPos === positions.from) {
      fromSide = "innerStart";
      fromNode = node;
      fromPos = pos;
    }

    // if we have found from at the starting position of this node, try to find to at the ending positions
    if (startPos === positions.from || innerStartPos === positions.from) {
      const endPos = pos + node.nodeSize;
      const innerEndPos = pos + node.nodeSize - 1;

      // is to at endPos?
      if (toSide === null && endPos === positions.to) {
        toSide = "end";
        toNode = node;
        toPos = pos;
      }

      // is to at innerEndPos?
      if (toSide === null && innerEndPos === positions.to) {
        toSide = "innerEnd";
        toNode = node;
        toPos = pos;
      }
    }

    // is to at startPos?
    if (toSide === null && startPos === positions.to) {
      toSide = "start";
      toNode = node;
      toPos = pos;
    }

    // is to at innerStart pos?
    if (toSide === null && innerStartPos === positions.to) {
      toSide = "innerStart";
      toNode = node;
      toPos = pos;
    }

    return true;
  });

  doc.nodesBetween(range.start, range.end, (node, pos) => {
    if (node.isInline) return true;

    const endPos = pos + node.nodeSize;
    const innerEndPos = pos + node.nodeSize - 1;

    // is from at endPos?
    if (fromSide === null && endPos === positions.from) {
      fromSide = "end";
      fromNode = node;
      fromPos = pos;
    }

    // is from at innerEndPos?
    if (fromSide === null && innerEndPos === positions.from) {
      fromSide = "innerEnd";
      fromNode = node;
      fromPos = pos;
    }

    // is to at endPos?
    if (toSide === null && endPos === positions.to) {
      toSide = "end";
      toNode = node;
      toPos = pos;
    }

    // is to at innerEndPos?
    if (toSide === null && innerEndPos === positions.to) {
      toSide = "innerEnd";
      toNode = node;
      toPos = pos;
    }

    return true;
  });

  if (
    fromSide === null ||
    toSide === null ||
    fromPos === null ||
    toPos === null
  ) {
    console.error("Not all positions found", {
      positions,
      range,
      from: { side: fromSide, pos: fromPos, node: fromNode },
      to: { side: toSide, pos: toPos, node: toNode },
    });
    throw new Error("Not all positions found");
  }

  console.log("found matching node sides", {
    positions,
    range,
    from: { side: fromSide, pos: fromPos, node: fromNode },
    to: { side: toSide, pos: toPos, node: toNode },
  });

  return {
    from: { side: fromSide, pos: fromPos },
    to: { side: toSide, pos: toPos },
  };
}
