---
"@papra/app": patch
---

Added the possibility to disable the initial startup execution of all scheduled tasks by setting the `RUN_SCHEDULED_TASKS_ON_STARTUP_DEFAULT=false` environment variable, mainly usefull for instance that reboot often, dev environments or fast startup requirements (few ms gained). Each task startup configuration remain individually configurable with their dedicated environment variable.
