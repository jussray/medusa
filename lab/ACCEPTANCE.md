# Operational acceptance boundary

The standalone lab is deliberately non-operational. Its synthetic signature, journal and concurrency results do not establish authorization, real target containment, or independent production acceptance. The boundary suite checks that a valid fictional signature never authorizes execution, real temporary-file paths are rejected, and temporary fixture contents, inode and mode remain unchanged. It does not exercise real containment. No operational guard replacement is proposed by this change.

The 23-test CI evidence is preserved in the registry. The original Batches 9–11 have not been received or reconciled. The new boundary suite requires its own CI result.

## Verified baseline

At `a90295a2364287fac818aaf04cd5b52e94dfe2d5`, the complete 26-test suite passed, including all three temporary-file boundary regressions. See the [exact-head receipt](../registry/evidence/l4-boundary-a90295a.json). This establishes preservation of the tested fixtures, not safe execution against real targets. Historical archive identity is not proof of current batch identity. Do not mark outstanding original source reconciliation complete without the actual source and provenance.

The synthetic acceptance work is complete at this baseline. Further changes should address a concrete requirement or missing source rather than generating successive receipts alone.
