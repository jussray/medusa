import unittest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from evidence_lab import canonical, review


class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.key = Ed25519PrivateKey.generate()
        self.record = {'scope': 'synthetic-only', 'fixture': 'fixture-a',
                       'observation': 'fixture-reviewed', 'issued': 100, 'expires': 200}

    def check(self, record=None, signature=None, key=None, now=150):
        if record is None:
            record = self.record
        if signature is None:
            signature = self.key.sign(canonical(record))
        if key is None:
            key = self.key.public_key()
        result = review(record, signature, key, now=now)
        self.assertEqual(result['authority'], 'NONE')
        self.assertFalse(result['releasable'])
        self.assertFalse(result['effect_executed'])
        return result['status']

    def test_valid_fixture_signature(self):
        self.assertEqual(self.check(), 'EVIDENCE_VALID')

    def test_tampered_record(self):
        sig = self.key.sign(canonical(self.record))
        record = dict(self.record, expires=300)
        self.assertEqual(self.check(record, sig), 'EVIDENCE_REJECTED')

    def test_wrong_signer(self):
        self.assertEqual(self.check(key=Ed25519PrivateKey.generate().public_key()), 'EVIDENCE_REJECTED')

    def test_expired_or_future_record(self):
        for now in (99, 200, 201):
            self.assertEqual(self.check(now=now), 'EVIDENCE_REJECTED')

    def test_other_fixture_rejected_even_if_signed(self):
        self.assertEqual(self.check(dict(self.record, fixture='fixture-b')), 'EVIDENCE_REJECTED')

    def test_permission_fields_rejected(self):
        self.assertEqual(self.check(dict(self.record, authority='ALLOW')), 'EVIDENCE_REJECTED')

    def test_malformed_values_rejected(self):
        for record in (dict(self.record, issued=True), dict(self.record, expires=100),
                       dict(self.record, scope='production')):
            self.assertEqual(self.check(record), 'EVIDENCE_REJECTED')

    def test_malformed_signature_rejected(self):
        self.assertEqual(self.check(signature=b'bad'), 'EVIDENCE_REJECTED')


if __name__ == '__main__':
    unittest.main()
