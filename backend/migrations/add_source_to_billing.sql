ALTER TABLE billing
  ADD COLUMN source VARCHAR(50) NULL COMMENT 'Customer acquisition source at time of billing' AFTER notes;
