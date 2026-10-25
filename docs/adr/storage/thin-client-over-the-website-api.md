---
status: accepted
date: 2026-10-25
---

# The app is a thin client over the website's API

The website's Next.js backend and its Postgres stay the only source of truth for bookings, working days, breaks and hot news. The app reads and writes them through `/api/admin/*` and keeps no database of its own. Clients keep booking on the website while the admin's phone is offline, so a local copy that syncs both ways would need conflict handling for one user. That cost buys nothing here.

## Consequences

- The scaffold's Drizzle setup is removed. `expo-sqlite` stays only for its key-value store, which holds the last API responses and phone-only settings.
- Offline, the app shows the last fetched data read-only. Every change needs a connection.
- Existing data needs no migration: the app shows what the website already holds.
- New admin capabilities are backend endpoints first, then screens.
