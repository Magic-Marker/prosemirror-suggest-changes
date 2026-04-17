import { type Transform } from "prosemirror-transform";
import { type Node } from "prosemirror-model";

// delete a given node, and traverse upwards deleting parent nodes if they are now empty
export function deleteNodeUpwards(
  transform: Transform,
  node: Node,
  pos: number,
) {
  let $mappedPos = transform.doc.resolve(pos);

  let deleteFrom = $mappedPos.pos;
  let deleteTo = $mappedPos.pos + node.nodeSize;
  console.log(
    "deleteNodeUpwards",
    "initial delete range covers node",
    node.toString(),
    { deleteFrom, deleteTo, $mappedPos },
  );

  while ($mappedPos.depth > 0) {
    const $nextMappedPos = transform.doc.resolve($mappedPos.before());
    console.log(
      "deleteNodeUpwards",
      "considering",
      $nextMappedPos.nodeAfter?.toString(),
      "for deletion",
      "childCount is",
      $nextMappedPos.nodeAfter?.childCount,
    );
    if ($nextMappedPos.nodeAfter?.childCount !== 1) break;
    console.log(
      "deleteNodeUpwards",
      "expanding to deleting node",
      $nextMappedPos.nodeAfter.toString(),
    );

    $mappedPos = $nextMappedPos;
    deleteFrom = $nextMappedPos.pos;
    deleteTo = $nextMappedPos.pos + $nextMappedPos.nodeAfter.nodeSize;

    console.log(
      "deleteNodeUpwards",
      "expanded delete range to cover node",
      $nextMappedPos.nodeAfter.toString(),
      {
        deleteFrom,
        deleteTo,
        $mappedPos: $nextMappedPos,
      },
    );
  }

  console.log(
    "deleteNodeUpwards",
    "final delete range covers node",
    $mappedPos.nodeAfter?.toString(),
    { deleteFrom, deleteTo, $mappedPos },
  );
  transform.delete(deleteFrom, deleteTo);
}
