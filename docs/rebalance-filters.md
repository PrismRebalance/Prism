# Rebalance Filters

Prism should only promote a rebalance when the candidate survives more than one optimistic assumption.

## Pass all of these first

- Quote quality is stable across repeated checks.
- Reserve assumptions are recent enough to trust.
- The move still helps after expected friction is included.

## Fail the candidate when

- The edge disappears after one worse quote.
- Reserve quality is unknown or stale.
- The proposal only looks good because the current portfolio snapshot is incomplete.

## Intent

The filter is there to reject fragile ideas before they become operational noise.
