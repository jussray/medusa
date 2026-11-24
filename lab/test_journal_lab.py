from contextlib import closing
import multiprocessing as mp
import os
import sqlite3
import tempfile
import unittest
from pathlib import Path
from journal_lab import JournalLab, JournalError


def worker(path, event, start, result):
    with closing(sqlite3.connect(path, timeout=10)) as db:
        lab = JournalLab(db)
        start.wait(timeout=10)
        try:
            lab.reserve(event)
            result.put('RESERVED')
        except JournalError:
            result.put('REFUSED')


def interrupted(path, after):
    with closing(sqlite3.connect(path, timeout=10)) as db:
        lab = JournalLab(db)
        lab.reserve('event-1')
        if after:
            lab.simulate('event-1')
        os._exit(73)


class JournalTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.path = str(Path(tmp.name) / 'synthetic.sqlite')
        with closing(sqlite3.connect(self.path)) as db:
            JournalLab(db).initialize()
        self.ctx = mp.get_context('spawn')

    def finish(self, proc):
        proc.join(15)
        if proc.is_alive():
            proc.terminate()
            proc.join(5)
            self.fail('synthetic worker timed out')

    def test_distinct_processes_reserve_only_once(self):
        for events in [('event-1', 'event-1'), ('event-1', 'event-2')]:
            with self.subTest(events=events):
                with tempfile.TemporaryDirectory() as tmp:
                    path = str(Path(tmp) / 'synthetic.sqlite')
                    with closing(sqlite3.connect(path)) as db:
                        JournalLab(db).initialize()
                    start = self.ctx.Barrier(2)
                    result = self.ctx.Queue()
                    workers = [self.ctx.Process(target=worker, args=(path, e, start, result)) for e in events]
                    for proc in workers:
                        proc.start()
                    for proc in workers:
                        self.finish(proc)
                        self.assertEqual(proc.exitcode, 0)
                    self.assertCountEqual([result.get(timeout=3) for _ in workers], ['RESERVED', 'REFUSED'])
                    with closing(sqlite3.connect(path)) as db:
                        self.assertEqual(len(JournalLab(db).snapshot()['intents']), 1)
                    result.close()
                    result.join_thread()

    def test_crash_before_simulation_preserves_reservation(self):
        self.check_crash(False)

    def test_crash_after_simulation_preserves_reservation(self):
        self.check_crash(True)

    def check_crash(self, after):
        proc = self.ctx.Process(target=interrupted, args=(self.path, after))
        proc.start()
        self.finish(proc)
        self.assertEqual(proc.exitcode, 73)
        with closing(sqlite3.connect(self.path)) as db:
            lab = JournalLab(db)
            self.assertEqual(lab.snapshot()['intents'], [('event-1', 'pending')])
            self.assertEqual(lab.snapshot()['fixture'], 'simulated' if after else 'available')
            self.assertEqual(lab.recover(), ['event-1'])
        with closing(sqlite3.connect(self.path)) as db:
            lab = JournalLab(db)
            self.assertEqual(lab.snapshot()['intents'], [('event-1', 'escalated')])
            self.assertEqual(lab.recover(), [])
            for event in ('event-1', 'event-2'):
                with self.assertRaises(JournalError):
                    lab.reserve(event)
            with self.assertRaises(JournalError):
                lab.complete('event-1')

    def test_normal_completion_and_restore_are_metadata_only(self):
        with closing(sqlite3.connect(self.path)) as db:
            lab = JournalLab(db)
            lab.reserve('event-1')
            lab.simulate('event-1')
            receipt = lab.complete('event-1')
            self.assertFalse(receipt['effect_executed'])
            self.assertEqual(receipt['authority'], 'NONE')
            lab.restore('event-1')
            self.assertEqual(lab.snapshot()['fixture'], 'available')
            with self.assertRaises(JournalError):
                lab.reserve('event-1')

    def test_unrecognized_event_never_changes_state(self):
        with closing(sqlite3.connect(self.path)) as db:
            lab = JournalLab(db)
            before = lab.snapshot()
            with self.assertRaises(JournalError):
                lab.reserve('external-event')
            self.assertEqual(before, lab.snapshot())


if __name__ == '__main__':
    unittest.main()
