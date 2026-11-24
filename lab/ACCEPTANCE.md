# Operational acceptance boundary

The standalone lab is deliberately non-operational. Its synthetic signature, journal and concurrency results do not establish authorization, real target containment, or independent production acceptance. The boundary suite checks that a valid fictional signature never authorizes execution, real temporary-file paths are rejected, and temporary fixture contents, inode and mode remain unchanged. It does not exercise real containment. No operational guard replacement is proposed by this change.

The 23-test CI evidence is preserved in the registry. The original Batches 9–11 have not been received or reconciled. The new boundary suite requires its own CI result.
