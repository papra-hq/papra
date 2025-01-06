-- Migration for adding full-text search virtual table for documents

CREATE VIRTUAL TABLE documents_fts USING fts5(id UNINDEXED, name, original_name, content, prefix='2 3 4');
--> statement-breakpoint

-- Copy data from documents to documents_fts for existing records
INSERT INTO documents_fts(id, name, original_name, content)
SELECT id, name, original_name, content FROM documents;
--> statement-breakpoint

CREATE TRIGGER trigger_documents_fts_insert AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(id, name, original_name, content) VALUES (new.id, new.name, new.original_name, new.content);
END;
--> statement-breakpoint

CREATE TRIGGER trigger_documents_fts_update AFTER UPDATE ON documents BEGIN
  UPDATE documents_fts SET name = new.name, original_name = new.original_name, content = new.content WHERE id = new.id;
END;
--> statement-breakpoint

CREATE TRIGGER trigger_documents_fts_delete AFTER DELETE ON documents BEGIN
  DELETE FROM documents_fts WHERE id = old.id;
END;
