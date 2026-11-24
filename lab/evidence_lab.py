"""Review signed fictional evidence; never grant permission or perform an action."""
import json
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey


def canonical(record):
    return json.dumps(record, sort_keys=True, separators=(',', ':'), allow_nan=False).encode('utf-8')


def review(record, signature, public_key, *, now):
    result = {'status': 'EVIDENCE_REJECTED', 'authority': 'NONE',
              'effect_executed': False, 'releasable': False, 'synthetic_only': True}
    if type(record) is not dict or set(record) != {'scope', 'fixture', 'observation', 'issued', 'expires'}:
        return result
    if (record['scope'], record['fixture'], record['observation']) != ('synthetic-only', 'fixture-a', 'fixture-reviewed'):
        return result
    issued, expires = record['issued'], record['expires']
    if any(type(t) is not int for t in (issued, expires, now)):
        return result
    if not 0 <= issued <= now < expires or expires - issued > 300:
        return result
    if not isinstance(public_key, Ed25519PublicKey) or type(signature) is not bytes:
        return result
    try:
        public_key.verify(signature, canonical(record))
    except (InvalidSignature, TypeError, ValueError):
        return result
    result['status'] = 'EVIDENCE_VALID'
    return result
