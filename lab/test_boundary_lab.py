"""Boundary regression: actual temporary fixtures must remain untouched."""
import tempfile
import unittest
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from evidence_lab import canonical, review
from actuator_lab import Lab, LabError


class BoundaryTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.file = self.root / 'fictional.txt'
        self.file.write_bytes(b'fictional fixture only')
        self.key = Ed25519PrivateKey.generate()
        self.record = {'scope': 'synthetic-only', 'fixture': 'fixture-a',
                       'observation': 'fixture-reviewed', 'issued': 100, 'expires': 200}

    def snapshot(self):
        return {p.name: (p.read_bytes(), p.stat().st_mode, p.stat().st_ino)
                for p in self.root.iterdir() if p.is_file()}

    def inspect(self, record):
        return review(record, self.key.sign(canonical(record)), self.key.public_key(), now=150)

    def test_signed_real_fixture_path_is_rejected(self):
        before = self.snapshot()
        result = self.inspect(dict(self.record, fixture=str(self.file)))
        self.assertEqual(result['status'], 'EVIDENCE_REJECTED')
        self.assertEqual(result['authority'], 'NONE')
        self.assertFalse(result['effect_executed'])
        self.assertEqual(self.snapshot(), before)

    def test_valid_fictional_signature_does_not_authorize(self):
        before = self.snapshot()
        result = self.inspect(self.record)
        self.assertEqual(result['status'], 'EVIDENCE_VALID')
        self.assertEqual(result['authority'], 'NONE')
        self.assertFalse(result['releasable'])
        self.assertFalse(result['effect_executed'])
        self.assertEqual(self.snapshot(), before)

    def test_simulator_refuses_real_path_and_preserves_fixture(self):
        before = self.snapshot()
        lab = Lab(lab_mode=True)
        with self.assertRaises(LabError):
            lab.quarantine('event-1', str(self.file))
        result = lab.quarantine('event-1', 'fixture-a')
        self.assertFalse(result['effect_executed'])
        lab.undo('event-1')
        self.assertEqual(self.snapshot(), before)


if __name__ == '__main__':
    unittest.main()
