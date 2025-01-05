-- Custom SQL migration file, put your code below! --

CREATE VIRTUAL TABLE documents_fts USING fts5(id UNINDEXED, name, original_name, content, content='documents', prefix='2 3 4');

-- Copy data from documents to documents_fts for existing records
INSERT INTO documents_fts(id, name, original_name, content)
SELECT id, name, original_name, content FROM documents;

CREATE TRIGGER trigger_documents_fts_insert AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(id, name, original_name, content) VALUES (new.id, new.name, new.original_name, new.content);
END;

CREATE TRIGGER trigger_documents_fts_update AFTER UPDATE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, id) VALUES('delete', old.id);
  INSERT INTO documents_fts(id, name, original_name, content) VALUES (new.id, new.name, new.original_name, new.content);
END;

CREATE TRIGGER trigger_documents_fts_delete AFTER DELETE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, id) VALUES('delete', old.id);
END;