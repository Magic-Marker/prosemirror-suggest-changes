# Split-Derived Adds Fall Through

When structure detection sees a newly materialized content node whose raw text
came from splitting an immediate accepted sibling, it returns
`reason: "split-derived-add"` and leaves the whole transaction to normal
suggestion tracking. This avoids mixing structure and text ownership inside one
transaction, and keeps split-derived content out of **Structure add
suggestions**.
