import { type Node } from "prosemirror-model";

/*
    This function is used by ProseMirror to verify structure steps
    https://github.com/ProseMirror/prosemirror-transform/blob/1.11.0/src/replace_step.ts#L163
    https://github.com/ProseMirror/prosemirror-transform/blob/1.11.0/src/replace_step.ts#L110

    If step is a structure step (structure: true), 
    it means the range it covers does not contain any content 
    except for closing and opening tokens (see https://prosemirror.net/docs/ref/#transform.ReplaceStep)
    
    ProseMirror throws an error if this function returns true for a structure step
    https://github.com/ProseMirror/prosemirror-transform/blob/1.11.0/src/replace_step.ts#L30
    
    We can use this function to do the opposite - 
    if some step has structure: false, 
    but this function return false,
    then we can treat the step as a structure step
 */
export function contentBetween(doc: Node, from: number, to: number) {
  // eslint-disable-next-line prefer-const
  let $from = doc.resolve(from),
    dist = to - from,
    depth = $from.depth;
  while (
    dist > 0 &&
    depth > 0 &&
    $from.indexAfter(depth) == $from.node(depth).childCount
  ) {
    depth--;
    dist--;
  }
  if (dist > 0) {
    let next = $from.node(depth).maybeChild($from.indexAfter(depth));
    while (dist > 0) {
      if (!next || next.isLeaf) return true;
      next = next.firstChild;
      dist--;
    }
  }
  return false;
}
