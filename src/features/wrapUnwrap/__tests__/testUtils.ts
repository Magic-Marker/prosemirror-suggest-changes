/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { type Node } from "prosemirror-model";
import { type Command, EditorState, TextSelection } from "prosemirror-state";
import { Step } from "prosemirror-transform";
import { eq } from "prosemirror-test-builder";
import { assert, expect } from "vitest";

export function assertCommandThrows(
  doc: Node,
  command: Command,
  errorMessage: string,
) {
  const editorState = EditorState.create({
    doc,
    selection: TextSelection.atEnd(doc),
  });
  expect(() => {
    command(editorState);
  }).toThrow(errorMessage);
}

export function assertDocumentChanged(
  docA: Node,
  docB: Node,
  command: Command,
) {
  const editorState = EditorState.create({
    doc: docA,
    selection: TextSelection.atEnd(docA),
  });

  command(editorState, (tr) => {
    const newState = editorState.apply(tr);
    assert(eq(newState.doc, docB), `Expected ${newState.doc} to match ${docB}`);
  });
}

export function applySteps(
  stepsData: object[],
  logInverseSteps?: boolean,
): Command {
  return (state, dispatch) => {
    const tr = state.tr;

    for (const stepData of stepsData) {
      const step = Step.fromJSON(tr.doc.type.schema, stepData);
      if (logInverseSteps) {
        console.log(JSON.stringify(step.invert(tr.doc).toJSON(), null, 2));
      }
      tr.step(step);
    }

    dispatch?.(tr);

    return true;
  };
}
