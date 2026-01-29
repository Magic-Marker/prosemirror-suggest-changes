import { describe, it } from "vitest";
import { testBuilders } from "../../../testing/testBuilders.js";
import { revertStructureSuggestion } from "../revertStructureSuggestion.js";
import {
  applySteps,
  assertCommandThrows,
  assertDocumentChanged,
} from "./testUtils.js";
import {
  initialDoc,
  finalDoc,
  finalDocWithMarks,
  steps,
  inverseSteps,
} from "./blockquoteWrapSingleNode.data.js";

describe("wrap a single node with a blockquote | [ReplaceAroundStep]", () => {
  it("should wrap a paragraph in a blockquote by applying 1 ReplaceAround step", () => {
    assertDocumentChanged(initialDoc, finalDoc, applySteps(steps));
  });

  it("should revert the wrap of a paragraph in a blockquote by applying 1 inverse ReplaceAround step", () => {
    assertDocumentChanged(
      finalDoc,
      initialDoc,
      applySteps([...inverseSteps].reverse()),
    );
  });

  it("should revert the wrap of a paragraph in a blockquote by reverting a structure suggestion", () => {
    assertDocumentChanged(
      finalDocWithMarks,
      initialDoc,
      revertStructureSuggestion(1),
    );
  });

  it("(untracked change inside the gap) should revert the wrap of a paragraph in a blockquote after the paragraph has been changed", () => {
    const finalStateWithChange = testBuilders.doc(
      testBuilders.structure(
        {
          id: 1,
          type: "structure",
          data: {
            value: "from",
            position: "start",
            gapFromOffset: 1,
            type: "replaceAround",
            slice: null,
            insert: 0,
            structure: true,
            debug: {
              inverseFrom: 0,
              inverseTo: 15,
              inverseGapFrom: 1,
              inverseGapTo: 14,
              gapFromOffset: 1,
              gapToOffset: 1,
              fromOffset: 1,
              toOffset: 1,
            },
          },
        },
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "to",
              position: "end",
              gapToOffset: 1,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 0,
                inverseTo: 15,
                inverseGapFrom: 1,
                inverseGapTo: 14,
                gapFromOffset: 1,
                gapToOffset: 1,
                fromOffset: 1,
                toOffset: 1,
              },
            },
          },
          testBuilders.blockquote(
            testBuilders.structure(
              {
                id: 1,
                type: "structure",
                data: {
                  value: "gapFrom",
                  position: "start",
                  fromOffset: 1,
                  type: "replaceAround",
                  slice: null,
                  insert: 0,
                  structure: true,
                  debug: {
                    inverseFrom: 0,
                    inverseTo: 15,
                    inverseGapFrom: 1,
                    inverseGapTo: 14,
                    gapFromOffset: 1,
                    gapToOffset: 1,
                    fromOffset: 1,
                    toOffset: 1,
                  },
                },
              },
              testBuilders.structure(
                {
                  id: 1,
                  type: "structure",
                  data: {
                    value: "gapTo",
                    position: "end",
                    toOffset: 1,
                    type: "replaceAround",
                    slice: null,
                    insert: 0,
                    structure: true,
                    debug: {
                      inverseFrom: 0,
                      inverseTo: 15,
                      inverseGapFrom: 1,
                      inverseGapTo: 14,
                      gapFromOffset: 1,
                      gapToOffset: 1,
                      fromOffset: 1,
                      toOffset: 1,
                    },
                  },
                },
                testBuilders.paragraph("NEW Hello World"),
              ),
            ),
          ),
        ),
      ),
    );

    const initialStateWithChange = testBuilders.doc(
      testBuilders.paragraph("NEW Hello World"),
    );

    assertDocumentChanged(
      finalStateWithChange,
      initialStateWithChange,
      revertStructureSuggestion(1),
    );
  });

  it("(untracked change inside the gap) should revert the wrap of a paragraph in a blockquote after the paragraph has been wrapped", () => {
    const finalStateWithChange = testBuilders.doc(
      testBuilders.structure(
        {
          id: 1,
          type: "structure",
          data: {
            value: "from",
            position: "start",
            gapFromOffset: 1,
            type: "replaceAround",
            slice: null,
            insert: 0,
            structure: true,
            debug: {
              inverseFrom: 0,
              inverseTo: 15,
              inverseGapFrom: 1,
              inverseGapTo: 14,
              gapFromOffset: 1,
              gapToOffset: 1,
              fromOffset: 1,
              toOffset: 1,
            },
          },
        },
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "to",
              position: "end",
              gapToOffset: 1,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 0,
                inverseTo: 15,
                inverseGapFrom: 1,
                inverseGapTo: 14,
                gapFromOffset: 1,
                gapToOffset: 1,
                fromOffset: 1,
                toOffset: 1,
              },
            },
          },
          testBuilders.blockquote(
            testBuilders.structure(
              {
                id: 1,
                type: "structure",
                data: {
                  value: "gapFrom",
                  position: "start",
                  fromOffset: 1,
                  type: "replaceAround",
                  slice: null,
                  insert: 0,
                  structure: true,
                  debug: {
                    inverseFrom: 0,
                    inverseTo: 15,
                    inverseGapFrom: 1,
                    inverseGapTo: 14,
                    gapFromOffset: 1,
                    gapToOffset: 1,
                    fromOffset: 1,
                    toOffset: 1,
                  },
                },
              },
              testBuilders.structure(
                {
                  id: 1,
                  type: "structure",
                  data: {
                    value: "gapTo",
                    position: "end",
                    toOffset: 1,
                    type: "replaceAround",
                    slice: null,
                    insert: 0,
                    structure: true,
                    debug: {
                      inverseFrom: 0,
                      inverseTo: 15,
                      inverseGapFrom: 1,
                      inverseGapTo: 14,
                      gapFromOffset: 1,
                      gapToOffset: 1,
                      fromOffset: 1,
                      toOffset: 1,
                    },
                  },
                },
                testBuilders.blockquote(testBuilders.paragraph("Hello World")),
              ),
            ),
          ),
        ),
      ),
    );

    const initialStateWithChange = testBuilders.doc(
      testBuilders.blockquote(testBuilders.paragraph("Hello World")),
    );

    assertDocumentChanged(
      finalStateWithChange,
      initialStateWithChange,
      revertStructureSuggestion(1),
    );
  });

  it("(untracked change around the gap) should revert the wrap of a paragraph in a blockquote after wrapping gap in a blockquote", () => {
    const finalStateWithChange = testBuilders.doc(
      testBuilders.structure(
        {
          id: 1,
          type: "structure",
          data: {
            value: "from",
            position: "start",
            gapFromOffset: 1,
            type: "replaceAround",
            slice: null,
            insert: 0,
            structure: true,
            debug: {
              inverseFrom: 0,
              inverseTo: 15,
              inverseGapFrom: 1,
              inverseGapTo: 14,
              gapFromOffset: 1,
              gapToOffset: 1,
              fromOffset: 1,
              toOffset: 1,
            },
          },
        },
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "to",
              position: "end",
              gapToOffset: 1,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 0,
                inverseTo: 15,
                inverseGapFrom: 1,
                inverseGapTo: 14,
                gapFromOffset: 1,
                gapToOffset: 1,
                fromOffset: 1,
                toOffset: 1,
              },
            },
          },
          testBuilders.blockquote(
            testBuilders.blockquote(
              testBuilders.structure(
                {
                  id: 1,
                  type: "structure",
                  data: {
                    value: "gapFrom",
                    position: "start",
                    fromOffset: 1,
                    type: "replaceAround",
                    slice: null,
                    insert: 0,
                    structure: true,
                    debug: {
                      inverseFrom: 0,
                      inverseTo: 15,
                      inverseGapFrom: 1,
                      inverseGapTo: 14,
                      gapFromOffset: 1,
                      gapToOffset: 1,
                      fromOffset: 1,
                      toOffset: 1,
                    },
                  },
                },
                testBuilders.structure(
                  {
                    id: 1,
                    type: "structure",
                    data: {
                      value: "gapTo",
                      position: "end",
                      toOffset: 1,
                      type: "replaceAround",
                      slice: null,
                      insert: 0,
                      structure: true,
                      debug: {
                        inverseFrom: 0,
                        inverseTo: 15,
                        inverseGapFrom: 1,
                        inverseGapTo: 14,
                        gapFromOffset: 1,
                        gapToOffset: 1,
                        fromOffset: 1,
                        toOffset: 1,
                      },
                    },
                  },
                  testBuilders.paragraph("Hello World"),
                ),
              ),
            ),
          ),
        ),
      ),
    );

    const initialStateWithChange = testBuilders.doc(
      testBuilders.paragraph("Hello World"),
    );

    assertDocumentChanged(
      finalStateWithChange,
      initialStateWithChange,
      revertStructureSuggestion(1),
    );
  });

  it("(untracked change outside the gap but inside the range) should revert the wrap of a paragraph in a blockquote after adding a new paragraph", () => {
    const finalStateWithChange = testBuilders.doc(
      testBuilders.structure(
        {
          id: 1,
          type: "structure",
          data: {
            value: "from",
            position: "start",
            gapFromOffset: 1,
            type: "replaceAround",
            slice: null,
            insert: 0,
            structure: true,
            debug: {
              inverseFrom: 0,
              inverseTo: 15,
              inverseGapFrom: 1,
              inverseGapTo: 14,
              gapFromOffset: 1,
              gapToOffset: 1,
              fromOffset: 1,
              toOffset: 1,
            },
          },
        },
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "to",
              position: "end",
              gapToOffset: 1,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 0,
                inverseTo: 15,
                inverseGapFrom: 1,
                inverseGapTo: 14,
                gapFromOffset: 1,
                gapToOffset: 1,
                fromOffset: 1,
                toOffset: 1,
              },
            },
          },
          testBuilders.blockquote(
            testBuilders.paragraph("NEW PARAGRAPH"), // insertion mark
            testBuilders.structure(
              {
                id: 1,
                type: "structure",
                data: {
                  value: "gapFrom",
                  position: "start",
                  fromOffset: 1,
                  type: "replaceAround",
                  slice: null,
                  insert: 0,
                  structure: true,
                  debug: {
                    inverseFrom: 0,
                    inverseTo: 15,
                    inverseGapFrom: 1,
                    inverseGapTo: 14,
                    gapFromOffset: 1,
                    gapToOffset: 1,
                    fromOffset: 1,
                    toOffset: 1,
                  },
                },
              },
              testBuilders.structure(
                {
                  id: 1,
                  type: "structure",
                  data: {
                    value: "gapTo",
                    position: "end",
                    toOffset: 1,
                    type: "replaceAround",
                    slice: null,
                    insert: 0,
                    structure: true,
                    debug: {
                      inverseFrom: 0,
                      inverseTo: 15,
                      inverseGapFrom: 1,
                      inverseGapTo: 14,
                      gapFromOffset: 1,
                      gapToOffset: 1,
                      fromOffset: 1,
                      toOffset: 1,
                    },
                  },
                },
                testBuilders.paragraph("Hello World"),
              ),
            ),
          ),
        ),
      ),
    );

    // for now, throw the exception

    assertCommandThrows(
      finalStateWithChange,
      revertStructureSuggestion(1),
      "Structure gap-replace would overwrite content",
    );
  });

  it("(untracked change deletes a node with mark) should revert the wrap of a paragraph in a blockquote after deleting the paragraph", () => {
    const finalStateWithChange = testBuilders.doc(
      testBuilders.structure(
        {
          id: 1,
          type: "structure",
          data: {
            value: "from",
            position: "start",
            gapFromOffset: 1,
            type: "replaceAround",
            slice: null,
            insert: 0,
            structure: true,
            debug: {
              inverseFrom: 0,
              inverseTo: 15,
              inverseGapFrom: 1,
              inverseGapTo: 14,
              gapFromOffset: 1,
              gapToOffset: 1,
              fromOffset: 1,
              toOffset: 1,
            },
          },
        },
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "to",
              position: "end",
              gapToOffset: 1,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 0,
                inverseTo: 15,
                inverseGapFrom: 1,
                inverseGapTo: 14,
                gapFromOffset: 1,
                gapToOffset: 1,
                fromOffset: 1,
                toOffset: 1,
              },
            },
          },
          testBuilders.blockquote(),
        ),
      ),
    );

    // for now, throw the exception (remove the marks)

    assertCommandThrows(
      finalStateWithChange,
      revertStructureSuggestion(1),
      "Could not find all gap marks for replace around suggestion id 1",
    );
  });

  it("(untracked change changes a node type) should revert the wrap of a paragraph in a blockquote after changing the paragraph to a heading", () => {
    const finalStateWithChange = testBuilders.doc(
      testBuilders.structure(
        {
          id: 1,
          type: "structure",
          data: {
            value: "from",
            position: "start",
            gapFromOffset: 1,
            type: "replaceAround",
            slice: null,
            insert: 0,
            structure: true,
            debug: {
              inverseFrom: 0,
              inverseTo: 15,
              inverseGapFrom: 1,
              inverseGapTo: 14,
              gapFromOffset: 1,
              gapToOffset: 1,
              fromOffset: 1,
              toOffset: 1,
            },
          },
        },
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "to",
              position: "end",
              gapToOffset: 1,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 0,
                inverseTo: 15,
                inverseGapFrom: 1,
                inverseGapTo: 14,
                gapFromOffset: 1,
                gapToOffset: 1,
                fromOffset: 1,
                toOffset: 1,
              },
            },
          },
          testBuilders.blockquote(
            testBuilders.structure(
              {
                id: 1,
                type: "structure",
                data: {
                  value: "gapFrom",
                  position: "start",
                  fromOffset: 1,
                  type: "replaceAround",
                  slice: null,
                  insert: 0,
                  structure: true,
                  debug: {
                    inverseFrom: 0,
                    inverseTo: 15,
                    inverseGapFrom: 1,
                    inverseGapTo: 14,
                    gapFromOffset: 1,
                    gapToOffset: 1,
                    fromOffset: 1,
                    toOffset: 1,
                  },
                },
              },
              testBuilders.structure(
                {
                  id: 1,
                  type: "structure",
                  data: {
                    value: "gapTo",
                    position: "end",
                    toOffset: 1,
                    type: "replaceAround",
                    slice: null,
                    insert: 0,
                    structure: true,
                    debug: {
                      inverseFrom: 0,
                      inverseTo: 15,
                      inverseGapFrom: 1,
                      inverseGapTo: 14,
                      gapFromOffset: 1,
                      gapToOffset: 1,
                      fromOffset: 1,
                      toOffset: 1,
                    },
                  },
                },
                testBuilders.heading({ level: 2 }, "Hello World"),
              ),
            ),
          ),
        ),
      ),
    );

    const initialStateWithChange = testBuilders.doc(
      testBuilders.heading({ level: 2 }, "Hello World"),
    );

    assertDocumentChanged(
      finalStateWithChange,
      initialStateWithChange,
      revertStructureSuggestion(1),
    );
  });

  it("(tracked insertion inside the gap) should revert the wrap after inserting tracked text inside the paragraph", () => {
    const finalStateWithChange = testBuilders.doc(
      testBuilders.structure(
        {
          id: 1,
          type: "structure",
          data: {
            value: "from",
            position: "start",
            gapFromOffset: 1,
            type: "replaceAround",
            slice: null,
            insert: 0,
            structure: true,
            debug: {
              inverseFrom: 0,
              inverseTo: 15,
              inverseGapFrom: 1,
              inverseGapTo: 14,
              gapFromOffset: 1,
              gapToOffset: 1,
              fromOffset: 1,
              toOffset: 1,
            },
          },
        },
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "to",
              position: "end",
              gapToOffset: 1,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 0,
                inverseTo: 15,
                inverseGapFrom: 1,
                inverseGapTo: 14,
                gapFromOffset: 1,
                gapToOffset: 1,
                fromOffset: 1,
                toOffset: 1,
              },
            },
          },
          testBuilders.blockquote(
            testBuilders.structure(
              {
                id: 1,
                type: "structure",
                data: {
                  value: "gapFrom",
                  position: "start",
                  fromOffset: 1,
                  type: "replaceAround",
                  slice: null,
                  insert: 0,
                  structure: true,
                  debug: {
                    inverseFrom: 0,
                    inverseTo: 15,
                    inverseGapFrom: 1,
                    inverseGapTo: 14,
                    gapFromOffset: 1,
                    gapToOffset: 1,
                    fromOffset: 1,
                    toOffset: 1,
                  },
                },
              },
              testBuilders.structure(
                {
                  id: 1,
                  type: "structure",
                  data: {
                    value: "gapTo",
                    position: "end",
                    toOffset: 1,
                    type: "replaceAround",
                    slice: null,
                    insert: 0,
                    structure: true,
                    debug: {
                      inverseFrom: 0,
                      inverseTo: 15,
                      inverseGapFrom: 1,
                      inverseGapTo: 14,
                      gapFromOffset: 1,
                      gapToOffset: 1,
                      fromOffset: 1,
                      toOffset: 1,
                    },
                  },
                },
                testBuilders.paragraph(
                  "Hello ",
                  testBuilders.insertion({ id: 2 }, "INSERTED "),
                  "World",
                ),
              ),
            ),
          ),
        ),
      ),
    );

    const expectedAfterRevert = testBuilders.doc(
      testBuilders.paragraph(
        "Hello ",
        testBuilders.insertion({ id: 2 }, "INSERTED "),
        "World",
      ),
    );

    assertDocumentChanged(
      finalStateWithChange,
      expectedAfterRevert,
      revertStructureSuggestion(1),
    );
  });

  it("(tracked deletion inside the gap) should revert the wrap after deleting tracked text inside the paragraph", () => {
    const finalStateWithChange = testBuilders.doc(
      testBuilders.structure(
        {
          id: 1,
          type: "structure",
          data: {
            value: "from",
            position: "start",
            gapFromOffset: 1,
            type: "replaceAround",
            slice: null,
            insert: 0,
            structure: true,
            debug: {
              inverseFrom: 0,
              inverseTo: 15,
              inverseGapFrom: 1,
              inverseGapTo: 14,
              gapFromOffset: 1,
              gapToOffset: 1,
              fromOffset: 1,
              toOffset: 1,
            },
          },
        },
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "to",
              position: "end",
              gapToOffset: 1,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 0,
                inverseTo: 15,
                inverseGapFrom: 1,
                inverseGapTo: 14,
                gapFromOffset: 1,
                gapToOffset: 1,
                fromOffset: 1,
                toOffset: 1,
              },
            },
          },
          testBuilders.blockquote(
            testBuilders.structure(
              {
                id: 1,
                type: "structure",
                data: {
                  value: "gapFrom",
                  position: "start",
                  fromOffset: 1,
                  type: "replaceAround",
                  slice: null,
                  insert: 0,
                  structure: true,
                  debug: {
                    inverseFrom: 0,
                    inverseTo: 15,
                    inverseGapFrom: 1,
                    inverseGapTo: 14,
                    gapFromOffset: 1,
                    gapToOffset: 1,
                    fromOffset: 1,
                    toOffset: 1,
                  },
                },
              },
              testBuilders.structure(
                {
                  id: 1,
                  type: "structure",
                  data: {
                    value: "gapTo",
                    position: "end",
                    toOffset: 1,
                    type: "replaceAround",
                    slice: null,
                    insert: 0,
                    structure: true,
                    debug: {
                      inverseFrom: 0,
                      inverseTo: 15,
                      inverseGapFrom: 1,
                      inverseGapTo: 14,
                      gapFromOffset: 1,
                      gapToOffset: 1,
                      fromOffset: 1,
                      toOffset: 1,
                    },
                  },
                },
                testBuilders.paragraph(
                  "Hello ",
                  testBuilders.deletion(
                    { id: 2, type: null, data: null },
                    "DELETED ",
                  ),
                  "World",
                ),
              ),
            ),
          ),
        ),
      ),
    );

    const expectedAfterRevert = testBuilders.doc(
      testBuilders.paragraph(
        "Hello ",
        testBuilders.deletion({ id: 2 }, "DELETED "),
        "World",
      ),
    );

    assertDocumentChanged(
      finalStateWithChange,
      expectedAfterRevert,
      revertStructureSuggestion(1),
    );
  });

  it("(tracked block insertion inside the gap) should throw when trying to revert after adding a tracked paragraph inside the gap", () => {
    const finalStateWithChange = testBuilders.doc(
      testBuilders.structure(
        {
          id: 1,
          type: "structure",
          data: {
            value: "from",
            position: "start",
            gapFromOffset: 1,
            type: "replaceAround",
            slice: null,
            insert: 0,
            structure: true,
            debug: {
              inverseFrom: 0,
              inverseTo: 15,
              inverseGapFrom: 1,
              inverseGapTo: 14,
              gapFromOffset: 1,
              gapToOffset: 1,
              fromOffset: 1,
              toOffset: 1,
            },
          },
        },
        testBuilders.structure(
          {
            id: 1,
            type: "structure",
            data: {
              value: "to",
              position: "end",
              gapToOffset: 1,
              type: "replaceAround",
              slice: null,
              insert: 0,
              structure: true,
              debug: {
                inverseFrom: 0,
                inverseTo: 15,
                inverseGapFrom: 1,
                inverseGapTo: 14,
                gapFromOffset: 1,
                gapToOffset: 1,
                fromOffset: 1,
                toOffset: 1,
              },
            },
          },
          testBuilders.blockquote(
            testBuilders.structure(
              {
                id: 1,
                type: "structure",
                data: {
                  value: "gapFrom",
                  position: "start",
                  fromOffset: 1,
                  type: "replaceAround",
                  slice: null,
                  insert: 0,
                  structure: true,
                  debug: {
                    inverseFrom: 0,
                    inverseTo: 15,
                    inverseGapFrom: 1,
                    inverseGapTo: 14,
                    gapFromOffset: 1,
                    gapToOffset: 1,
                    fromOffset: 1,
                    toOffset: 1,
                  },
                },
              },
              testBuilders.structure(
                {
                  id: 1,
                  type: "structure",
                  data: {
                    value: "gapTo",
                    position: "end",
                    toOffset: 1,
                    type: "replaceAround",
                    slice: null,
                    insert: 0,
                    structure: true,
                    debug: {
                      inverseFrom: 0,
                      inverseTo: 15,
                      inverseGapFrom: 1,
                      inverseGapTo: 14,
                      gapFromOffset: 1,
                      gapToOffset: 1,
                      fromOffset: 1,
                      toOffset: 1,
                    },
                  },
                },
                testBuilders.paragraph("Hello World"),
              ),
            ),
            // New tracked paragraph AFTER gapTo but before "to" (inside blockquote)
            testBuilders.insertion(
              { id: 2 },
              testBuilders.paragraph("NEW TRACKED PARAGRAPH"),
            ),
          ),
        ),
      ),
    );

    // Should throw because content exists outside gap but inside range
    assertCommandThrows(
      finalStateWithChange,
      revertStructureSuggestion(1),
      "Structure gap-replace would overwrite content",
    );
  });
});
