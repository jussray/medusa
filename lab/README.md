# Synthetic Layer 4 acceptance model

In-memory behavior model only. Accepts built-in fictional fixtures and event IDs. No filesystem actions, external services, grants or operational authority. Every receipt is non-releasable. Run `cd lab && python3 -m unittest -v test_actuator_lab test_actuator_concurrency`. Device and crash behavior are simulated, not actual filesystem or durable restart evidence. The live guard remains separate and non-executing.

## Evidence

The earlier synthetic eight-test CI suite and archive registry passed at commit 1712a66e330c1d345965f620b468f77f1bc47181 ([CI job](https://github.com/jussray/medusa/actions/runs/45336033829/job/138248212310)). A new regression test failed locally before the target reservation correction; the complete ten-test synthetic suite then passed locally. Tests cover concurrent threads in one model instance and reservation of unresolved synthetic targets across event IDs. These results do not establish process concurrency, actual filesystem safety, or durable recovery.
