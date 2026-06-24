---
'@papra/app': patch
---

Added the possibility to configure the file size polling interval for ingestion folder watchers.

- `INGESTION_FOLDER_WATCHER_FILE_STABILITY_THRESHOLD_MS`: The amount of time in milliseconds for a file size to remain constant before being consumed. This helps to avoid processing files that are still being written to (e.g., scanners, cameras, network shares, etc.).
- `INGESTION_FOLDER_WATCHER_FILE_STABILITY_POLL_INTERVAL_MS`: The interval in milliseconds at which the file size is polled while waiting for write to finish.
