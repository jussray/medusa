"""SQLite-backed synthetic state model. No action on actual targets."""
from contextlib import contextmanager


class JournalError(ValueError):
    pass


class JournalLab:
    def __init__(self, db):
        self.db = db
        db.execute('PRAGMA synchronous=FULL')

    @contextmanager
    def transaction(self):
        self.db.execute('BEGIN IMMEDIATE')
        try:
            yield
            self.db.commit()
        except BaseException:
            self.db.rollback()
            raise

    def initialize(self):
        with self.transaction():
            self.db.execute('CREATE TABLE IF NOT EXISTS fixture (id INTEGER PRIMARY KEY CHECK(id=1), state TEXT NOT NULL)')
            self.db.execute('CREATE TABLE IF NOT EXISTS intents (event TEXT PRIMARY KEY, state TEXT NOT NULL)')
            self.db.execute("INSERT OR IGNORE INTO fixture VALUES (1, 'available')")

    def snapshot(self):
        with self.transaction():
            return {'fixture': self.db.execute('SELECT state FROM fixture WHERE id=1').fetchone()[0],
                    'intents': self.db.execute('SELECT event,state FROM intents ORDER BY event').fetchall()}

    def reserve(self, event):
        if event not in ('event-1', 'event-2'):
            raise JournalError('SYNTHETIC_EVENT_REQUIRED')
        with self.transaction():
            if self.db.execute('SELECT 1 FROM intents WHERE event=?', (event,)).fetchone():
                raise JournalError('REPLAY_REFUSED')
            if self.db.execute("SELECT 1 FROM intents WHERE state IN ('pending','escalated','done')").fetchone():
                raise JournalError('FIXTURE_RESERVED')
            if self.db.execute('SELECT state FROM fixture WHERE id=1').fetchone() != ('available',):
                raise JournalError('FIXTURE_UNAVAILABLE')
            self.db.execute("INSERT INTO intents VALUES (?, 'pending')", (event,))

    def transition(self, event, expected, old_fixture, new_fixture, new_state):
        with self.transaction():
            if self.db.execute('SELECT state FROM intents WHERE event=?', (event,)).fetchone() != (expected,):
                raise JournalError('STATE_REFUSED')
            if self.db.execute('SELECT state FROM fixture WHERE id=1').fetchone() != (old_fixture,):
                raise JournalError('FIXTURE_STATE_REFUSED')
            self.db.execute('UPDATE fixture SET state=? WHERE id=1', (new_fixture,))
            self.db.execute('UPDATE intents SET state=? WHERE event=?', (new_state, event))
        return {'status': new_state, 'authority': 'NONE', 'effect_executed': False, 'synthetic_only': True, 'releasable': False}

    def simulate(self, event):
        return self.transition(event, 'pending', 'available', 'simulated', 'pending')

    def complete(self, event):
        return self.transition(event, 'pending', 'simulated', 'simulated', 'done')

    def restore(self, event):
        return self.transition(event, 'done', 'simulated', 'available', 'restored')

    def recover(self):
        with self.transaction():
            pending = [r[0] for r in self.db.execute("SELECT event FROM intents WHERE state='pending' ORDER BY event")]
            self.db.execute("UPDATE intents SET state='escalated' WHERE state='pending'")
            return pending
