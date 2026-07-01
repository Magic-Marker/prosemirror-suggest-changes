import { EditorState } from "prosemirror-state";
import { Step } from "prosemirror-transform";
import { describe, expect, it } from "vitest";
import { createSchema } from "../../../testing/e2eTestSchema.js";
import { detectProseMirrorSplitBlockAfterSelectionDelete } from "./detectProseMirrorSplitBlockAfterSelectionDelete.js";

const schema = createSchema();

const LIST_BOUNDARY_DOC = {
  type: "doc",
  content: [
    {
      type: "orderedList",
      attrs: { id: "node-0" },
      content: [1, 2, 3, 4, 5].map((index) => ({
        type: "listItem",
        attrs: { id: `node-${String(index * 2 - 1)}` },
        content: [
          {
            type: "paragraph",
            attrs: { id: `node-${String(index * 2)}` },
            content: [{ type: "text", text: `Item ${String(index)}` }],
          },
        ],
      })),
    },
  ],
};

const DELETE_STEP = { stepType: "replace", from: 17, to: 27 };

const SPLIT_STEP = {
  stepType: "replace",
  from: 17,
  to: 17,
  slice: {
    content: [
      { type: "paragraph", attrs: { id: "node-4" } },
      { type: "paragraph", attrs: { id: "node-4" } },
    ],
    openStart: 1,
    openEnd: 1,
  },
  structure: true,
};

function createTransaction(stepsJSON: object[]) {
  const doc = schema.nodeFromJSON(LIST_BOUNDARY_DOC);
  const transaction = EditorState.create({ doc }).tr;

  stepsJSON.forEach((stepJSON) => {
    transaction.step(Step.fromJSON(schema, stepJSON));
  });

  return transaction;
}

describe("detectProseMirrorSplitBlockAfterSelectionDelete", () => {
  it("detects ProseMirror's deleteSelection plus splitBlock transaction shape", () => {
    const transaction = createTransaction([DELETE_STEP, SPLIT_STEP]);

    const shape = detectProseMirrorSplitBlockAfterSelectionDelete(transaction);

    expect(shape).toMatchObject({
      type: "proseMirrorSplitBlockAfterSelectionDelete",
      deleteStep: {
        from: 17,
        to: 27,
      },
      splitStep: {
        from: 17,
        to: 17,
      },
    });
  });

  it("rejects the deletion half by itself", () => {
    const transaction = createTransaction([DELETE_STEP]);

    expect(detectProseMirrorSplitBlockAfterSelectionDelete(transaction)).toBe(
      null,
    );
  });

  it("rejects a split step that is not structural", () => {
    const transaction = createTransaction([
      DELETE_STEP,
      { ...SPLIT_STEP, structure: false },
    ]);

    expect(detectProseMirrorSplitBlockAfterSelectionDelete(transaction)).toBe(
      null,
    );
  });

  it("rejects split children without a shared node id", () => {
    const transaction = createTransaction([
      DELETE_STEP,
      {
        ...SPLIT_STEP,
        slice: {
          ...SPLIT_STEP.slice,
          content: [
            { type: "paragraph", attrs: { id: "node-4" } },
            { type: "paragraph", attrs: { id: "node-5" } },
          ],
        },
      },
    ]);

    expect(detectProseMirrorSplitBlockAfterSelectionDelete(transaction)).toBe(
      null,
    );
  });
});
