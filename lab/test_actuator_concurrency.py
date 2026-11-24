from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
import unittest

from actuator_lab import Lab, LabError


class LabConcurrencyTests(unittest.TestCase):
    def test_interrupted_target_stays_reserved_across_events(self):
        lab = Lab(lab_mode=True)
        lab.quarantine('event-1', 'fixture-a', crash='before')
        for recovered in (False, True):
            if recovered:
                self.assertEqual(lab.recover(), ['event-1'])
            before = lab.snapshot()
            with self.assertRaisesRegex(LabError, 'UNRESOLVED_TARGET'):
                lab.quarantine('event-2', 'fixture-a')
            self.assertEqual(lab.snapshot(), before)

    def test_parallel_requests_have_one_simulated_effect(self):
        for events in (('event-1', 'event-1'), ('event-1', 'event-2')):
            with self.subTest(events=events):
                lab = Lab(lab_mode=True)
                start = Barrier(2)
                def request(event):
                    start.wait(timeout=5)
                    try:
                        return lab.quarantine(event, 'fixture-a')['status']
                    except LabError:
                        return 'REFUSED'
                with ThreadPoolExecutor(max_workers=2) as pool:
                    results = list(pool.map(request, events))
                self.assertCountEqual(results, ['SIMULATED_QUARANTINE', 'REFUSED'])
                state = lab.snapshot()
                self.assertEqual(len(state['quarantined']), 1)
                self.assertEqual(len(state['intents']), 1)


if __name__ == '__main__':
    unittest.main()
