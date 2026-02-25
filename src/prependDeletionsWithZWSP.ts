import { type Transaction } from "prosemirror-state";
import { getSuggestionMarks } from "./utils.js";
import { Transform } from "prosemirror-transform";
import { ZWSP } from "./constants.js";
import { type SuggestionId } from "./generateId.js";

export function prependDeletionsWithZWSP(
  transaction: Transaction,
  opts?: { experimental_deletions?: "hidden" | "visible" },
): Transaction {
  console.groupCollapsed("prepend deletions with zwsp");

  const { deletion } = getSuggestionMarks(transaction.doc.type.schema);

  let transform = new Transform(transaction.doc);

  transform.doc.descendants((node, pos) => {
    const mark = node.marks.find(
      (mark) => mark.type === deletion && mark.attrs["type"] === "anchor",
    );
    if (!node.isText || mark == null) return true;

    const mappedPos = transform.mapping.map(pos);

    transform.delete(mappedPos, mappedPos + node.nodeSize);
    console.log("found zwsp, deleted", {
      from: mappedPos,
      to: mappedPos + node.nodeSize,
    });

    return true;
  });

  transform.steps.forEach((step) => {
    transaction.step(step);
  });
  console.log(
    `added ${String(transform.steps.length)} remove zwsp steps to tr`,
  );

  if (opts?.experimental_deletions !== "hidden") {
    console.log("deletions are visible, skipping prepend zwsp");
    console.groupEnd();
    return transaction;
  }

  transform = new Transform(transaction.doc);

  transform.doc.descendants((node, pos) => {
    if (!node.inlineContent) return true;

    const mark = node.firstChild?.marks.find((mark) => mark.type === deletion);
    if (mark == null) return true;
    if (mark.attrs["type"] === "anchor") return true;

    const zwspNode = transform.doc.type.schema.text(ZWSP, [
      deletion.create({ type: "anchor", id: mark.attrs["id"] as SuggestionId }),
    ]);
    const mappedPos = transform.mapping.map(pos);

    transform.insert(mappedPos + 1, zwspNode);
    console.log(
      "found first-child-deletion inline content node, inserted zwsp at",
      {
        pos,
        mappedPos,
      },
    );

    return true;
  });

  transform.steps.forEach((step) => {
    transaction.step(step);
  });
  console.log(`added ${String(transform.steps.length)} add zwsp steps to tr`);

  console.groupEnd();

  return transaction;
}
