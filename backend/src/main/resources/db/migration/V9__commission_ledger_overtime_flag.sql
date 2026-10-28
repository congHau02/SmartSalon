ALTER TABLE commission_ledgers ADD COLUMN IF NOT EXISTS overtime BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE commission_ledgers SET overtime = TRUE WHERE calculation_notes LIKE '%[OT 1.2x]%';
