import { type Transform } from "prosemirror-transform";
import { type Node } from "prosemirror-model";
import { getNodeId } from "../getNodeId.js";

const TRACE_ENABLED = false;
function trace(...args: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!TRACE_ENABLED) return;
  console.log("[deleteNodeUpwards]", "\n", ...args);
}

export function deleteNodeUpwards(
  transform: Transform,
  node: Node,
  pos: number,
) {
  let $mappedPos = transform.doc.resolve(pos);
  trace(
    "attempting to delete node",
    node.type.name,
    getNodeId(node),
    "\n",
    "node subtree:\n",
    node.toString(),
    "\n",
    "node parent:",
    $mappedPos.parent.type.name,
    getNodeId($mappedPos.parent),
    "\n",
    { node, parent: $mappedPos.parent },
  );

  let deleteFrom = $mappedPos.pos;
  let deleteTo = $mappedPos.pos + node.nodeSize;

  // Structure marks live on content nodes, but added wrappers can become empty
  // after that content is removed. Delete upward until the next parent still has
  // another child that should survive.
  while ($mappedPos.depth > 0) {
    const $nextMappedPos = transform.doc.resolve($mappedPos.before());
    if ($nextMappedPos.nodeAfter?.childCount !== 1) {
      trace(
        "stopping deletion at non-empty node:",
        $nextMappedPos.nodeAfter?.type.name,
        $nextMappedPos.nodeAfter == null
          ? null
          : getNodeId($nextMappedPos.nodeAfter),
        "\n",
        "non-empty node parent:",
        $nextMappedPos.parent.type.name,
        getNodeId($nextMappedPos.parent),
        "\n",
        "non-empty node subtree:\n",
        $nextMappedPos.nodeAfter?.toString(),
        "\n",
        "non-empty node subtree direct children:\n",
        $nextMappedPos.nodeAfter?.children
          .map((child) => `${child.type.name} ${getNodeId(child) ?? "null"}`)
          .join(", "),
        {
          nonEmptyNode: $nextMappedPos.nodeAfter,
          nonEmptyNodeParent: $nextMappedPos.parent,
        },
      );
      break;
    }

    $mappedPos = $nextMappedPos;
    deleteFrom = $nextMappedPos.pos;
    deleteTo = $nextMappedPos.pos + $nextMappedPos.nodeAfter.nodeSize;
  }

  trace(
    "deleting subtree:\n",
    $mappedPos.nodeAfter?.toString(),
    "\n",
    "subtree root node:",
    $mappedPos.nodeAfter?.type.name,
    $mappedPos.nodeAfter == null ? null : getNodeId($mappedPos.nodeAfter),
    "\n",
    "subtree root parent node:",
    $mappedPos.parent.type.name,
    getNodeId($mappedPos.parent),
    "\n",
    "non-empty node subtree direct children:\n",
    $mappedPos.nodeAfter?.children
      .map((child) => `${child.type.name} (${getNodeId(child) ?? "null"}`)
      .join(", "),
    "\n",
    {
      node: $mappedPos.nodeAfter,
      parent: $mappedPos.parent,
      $deleteFrom: $mappedPos.doc.resolve(deleteFrom),
      $deleteTo: $mappedPos.doc.resolve(deleteTo),
    },
  );
  transform.delete(deleteFrom, deleteTo);
}
