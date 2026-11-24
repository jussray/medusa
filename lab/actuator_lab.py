"""Synthetic Layer 4 behavior model. No filesystem or external services."""
from copy import deepcopy
from threading import RLock


class LabError(ValueError):
    pass


class Lab:
    def __init__(self, *, lab_mode):
        if lab_mode is not True:
            raise LabError('LAB_MODE_REQUIRED')
        self._available = {'fixture-a': b'example synthetic data'}
        self._quarantined = {}
        self._intents = {}
        self._lock = RLock()

    @staticmethod
    def _receipt(status):
        return {'status': status, 'authority': 'NONE', 'effect_executed': False,
                'releasable': False, 'synthetic_only': True}

    def snapshot(self):
        with self._lock:
            return deepcopy({'available': self._available,
                             'quarantined': self._quarantined,
                             'intents': self._intents})

    def quarantine(self, event, target, *, same_device=True, crash=None):
        with self._lock:
            if event not in ('event-1', 'event-2') or target != 'fixture-a':
                raise LabError('SYNTHETIC_FIXTURE_REQUIRED')
            if event in self._intents:
                raise LabError('REPLAY_REFUSED')
            if same_device is not True:
                raise LabError('CROSS_DEVICE_REFUSED')
            if crash not in (None, 'before', 'after'):
                raise LabError('INVALID_CRASH_POINT')
            if target not in self._available:
                raise LabError('FIXTURE_UNAVAILABLE')
            self._intents[event] = {'state': 'pending', 'target': target}
            if crash == 'before':
                return self._receipt('SIMULATED_INTERRUPTION')
            self._quarantined[event] = self._available.pop(target)
            if crash == 'after':
                return self._receipt('SIMULATED_INTERRUPTION')
            self._intents[event]['state'] = 'done'
            return self._receipt('SIMULATED_QUARANTINE')

    def recover(self):
        with self._lock:
            pending = [e for e, r in self._intents.items() if r['state'] == 'pending']
            for e in pending:
                self._intents[e]['state'] = 'escalated'
            return pending

    def undo(self, event):
        with self._lock:
            record = self._intents.get(event)
            if not record or record['state'] != 'done':
                raise LabError('UNDO_NOT_CONFIRMED')
            target = record['target']
            if target in self._available or event not in self._quarantined:
                raise LabError('RESTORE_CONFLICT')
            self._available[target] = self._quarantined.pop(event)
            record['state'] = 'restored'
            return self._receipt('SIMULATED_RESTORE')
