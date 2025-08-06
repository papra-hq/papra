ALTER TABLE documents ADD COLUMN encryption_key TEXT NOT NULL DEFAULT ''; --> statement-breakpoint
UPDATE documents SET encryption_key = (hex(randomblob(32))) WHERE encryption_key = ''; 