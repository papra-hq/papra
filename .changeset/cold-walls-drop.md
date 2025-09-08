---
"@papra/app-server": patch
---

Fix a bug where the ingestion folder was not working when the done or error destination folder path (INGESTION_FOLDER_POST_PROCESSING_MOVE_FOLDER_PATH and INGESTION_FOLDER_ERROR_FOLDER_PATH) were absolute.
