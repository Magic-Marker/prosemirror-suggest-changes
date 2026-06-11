# Start-To-Start Textblock Deletion

This context covers single replace-step text-selection deletions that delete
from the start of one textblock to the start of another.

## Language

**Start-to-start textblock deletion**: A text-selection deletion whose visible
range starts at the beginning of one textblock and ends at the beginning of a
later textblock. _Avoid_: PM 1.12 deletion shape, whole textblock deletion

**Semantic deletion range**: The user-visible text-selection range that should
be tracked as deleted content, even when the dispatched replace step uses
expanded node-boundary positions. _Avoid_: fixed range, adjusted step
