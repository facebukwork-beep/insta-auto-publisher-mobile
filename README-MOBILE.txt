INSTA AUTO PUBLISHER MOBILE v13 FULL MANAGER
============================================

This PWA uses the same backend as the PC Chrome extension:
https://insta-auto-publisher-backend.onrender.com

Included:
- Shared accounts and account recovery
- Up to 15 accounts
- Up to 100 videos per batch
- Video + _caption / _caption.txt auto matching
- Folder picker + manual file picker
- Random Window, 24 Hours, Fixed Time (AM/PM)
- Per-account 5 posts x 10-minute gaps, then 1-hour break, repeat
- Automatic next-day continuation
- Phone upload resume queue
- Retry Uploads Now + Clear Pending Uploads
- Queue search/status filters
- Post Now / Delete / Retry failed / Delete all failed
- Published Posts + direct Instagram link
- Google Drive connect/reconnect + Drive test
- Storage status: Postgres / Google Drive / restart-safe
- Next-post live countdown

UPGRADE EXISTING GITHUB PAGES:
1. Upload/replace ALL files from this folder in the existing insta-auto-publisher-mobile GitHub repo root.
2. Commit changes.
3. GitHub Pages will redeploy automatically.
4. On phone, refresh the PWA/site. If the old version appears, fully close/reopen once; the v13 service worker uses a new cache.

Important:
- Jobs already on the backend keep running when the phone/app is closed.
- Phone files that have not finished uploading cannot reliably continue when the mobile browser is fully killed. They are stored in IndexedDB and resume when the PWA is reopened.
- Backend exact-time execution can still be delayed if a free Render service sleeps. Durable Postgres/Drive prevents data loss, not service sleep.
