# Insta Auto Publisher v14.5 — Monthly Smart 24H Backend

Durable backend for the PC and mobile managers.

## Included
- Neon/Postgres durable accounts, jobs, scheduler state and Google Drive OAuth refresh token.
- Google Drive durable media with post-success cleanup.
- Global Pause / Resume.
- Wake catch-up protection so overdue jobs are re-spaced instead of dumped at once.
- Monthly Smart plan metadata + `GET /api/monthly-plans`.
- Idempotent resumable upload chunks to reduce duplicate jobs after network retries.
- Compatible with PC v11.8 and Mobile v15.

## Existing environment variables
Keep your working `APP_SECRET_KEY`, `DATABASE_URL`, `GRAPH_API_VERSION`, `GDRIVE_CLIENT_ID`, `GDRIVE_CLIENT_SECRET`, `GDRIVE_FOLDER_ID` and `KEEP_MEDIA_AFTER_PUBLISH_HOURS`. Google Drive can stay connected through the one-click OAuth route.

## Timing note
Durable storage prevents data loss. Exact scheduled-time execution still requires the backend process to stay awake; a sleeping free Render service can delay jobs.
