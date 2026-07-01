# Structure Suggestion Revert Order

Rejecting changes reverts Structure suggestions before inline suggestion
cleanup, because structure revert changes document shape and inline cleanup must
run against the remaining shape. Structure marks are reverted from the current
document in right-to-left order, searching again after each revert, so nested
Structure marks are handled after prior reverts have changed positions and local
descendants are removed before ancestors.

When a requested Structure suggestion depends on another stacked Structure move
suggestion on the same content node, revert the prerequisite suggestion first
because same-node stacked moves are the dependency case we understand today.
This is good enough for current coverage, not the final dependency model; a full
topological sort across the document is the likely future direction once
cross-node dependencies are defined precisely.
