# Primary And Supporting Structure Marks

Structure suggestions keep every Structure mark needed to apply or revert a
structural edit, but only Primary Structure marks represent the user-visible
source of the suggestion.

Supporting Structure marks remain in the same suggestion ID for collateral
wrapper movement, because dropping them would weaken revert correctness while
showing them as normal changes would expose implementation details to users. We
chose explicit mark roles over presentation-only inference or storing supporting
operations on the primary mark, because role metadata keeps apply/revert
ID-based and makes the visibility contract local to each mark.
