import unittest
from actuator_lab import Lab, LabError


class LabTests(unittest.TestCase):
    def test_requires_explicit_lab_mode(self):
        with self.assertRaises(LabError):
            Lab(lab_mode=False)

    def test_only_synthetic_fixture(self):
        lab = Lab(lab_mode=True)
        with self.assertRaises(LabError):
            lab.quarantine('event-1', '/etc/passwd')

    def test_quarantine_and_undo_preserve_bytes(self):
        lab = Lab(lab_mode=True)
        old = lab.snapshot()['available']['fixture-a']
        r = lab.quarantine('event-1', 'fixture-a')
        self.assertEqual(r['status'], 'SIMULATED_QUARANTINE')
        self.assertFalse(r['effect_executed'])
        self.assertEqual(r['authority'], 'NONE')
        self.assertNotIn('fixture-a', lab.snapshot()['available'])
        self.assertEqual(lab.undo('event-1')['status'], 'SIMULATED_RESTORE')
        self.assertEqual(lab.snapshot()['available']['fixture-a'], old)

    def test_replay_even_after_undo(self):
        lab = Lab(lab_mode=True)
        lab.quarantine('event-1', 'fixture-a')
        lab.undo('event-1')
        with self.assertRaises(LabError):
            lab.quarantine('event-1', 'fixture-a')

    def test_cross_device_refusal_changes_nothing(self):
        lab = Lab(lab_mode=True)
        before = lab.snapshot()
        with self.assertRaises(LabError):
            lab.quarantine('event-1', 'fixture-a', same_device=False)
        self.assertEqual(lab.snapshot(), before)

    def test_pending_intent_escalates_without_retry(self):
        for crash in ('before', 'after'):
            with self.subTest(crash=crash):
                lab = Lab(lab_mode=True)
                lab.quarantine('event-1', 'fixture-a', crash=crash)
                self.assertEqual(lab.snapshot()['intents']['event-1']['state'], 'pending')
                self.assertEqual(lab.recover(), ['event-1'])
                self.assertEqual(lab.recover(), [])
                with self.assertRaises(LabError):
                    lab.quarantine('event-1', 'fixture-a')
                with self.assertRaises(LabError):
                    lab.undo('event-1')

    def test_different_event_cannot_move_missing_fixture(self):
        lab = Lab(lab_mode=True)
        lab.quarantine('event-1', 'fixture-a')
        with self.assertRaises(LabError):
            lab.quarantine('event-2', 'fixture-a')

    def test_snapshot_does_not_expose_mutable_state(self):
        lab = Lab(lab_mode=True)
        lab.snapshot()['available'].clear()
        self.assertIn('fixture-a', lab.snapshot()['available'])


if __name__ == '__main__':
    unittest.main()
