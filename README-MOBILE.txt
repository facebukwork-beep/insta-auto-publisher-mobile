INSTA AUTO PUBLISHER MOBILE v12
===============================

This is a standalone mobile PWA/dashboard. It does NOT replace the Chrome extension or backend.
It connects to your existing backend:
https://insta-auto-publisher-backend.onrender.com

Recommended deployment: GitHub Pages
1. Create a new GitHub repository, e.g. insta-auto-publisher-mobile.
2. Upload ALL files from this folder to the repository root (do not upload the ZIP itself).
3. GitHub repo -> Settings -> Pages -> Build and deployment -> Deploy from a branch.
4. Branch: main, folder: /(root), Save.
5. Open the generated https://...github.io/... URL on your phone.
6. Enter your backend URL once. The app remembers it.
7. Browser menu -> Add to Home Screen / Install App.

Important behavior:
- Jobs already uploaded/scheduled to the backend continue even when the phone/browser is closed.
- Files that are still uploading from the phone are saved into a local resume queue first. If the phone/browser closes during upload, reopen the mobile app and it resumes.
- On some mobile browsers, uploads cannot continue while the browser is fully closed. The app therefore persists the pending upload locally rather than losing it.
- Do not share your backend URL publicly. The current backend APIs do not have user-login authentication.

Scheduling pattern per account:
5 posts at 10-minute gaps -> 1 hour break after the 5th -> repeat.
Each account has its own independent timeline. If the timeline crosses midnight it automatically continues on the next date.
