# Массаж

Android admin app for the massage booking website. The admin accepts and declines bookings, opens working days, adds breaks, edits the hot news and gets a push for every new, cancelled or rebooked booking. The website's backend in `massage-appointments` holds all data ([ADR](docs/adr/storage/thin-client-over-the-website-api.md)).

```bash
pnpm install
pnpm start          # Metro for a development build
pnpm typecheck
pnpm lint
pnpm test
```

## Developing against the local backend

Start the backend with `docker compose up` in `massage-appointments`, then point the app at the Mac's LAN address in `.env.local`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000
```

Without it the app talks to production. Push notifications need a development build (`eas build --profile development --platform android`), because Expo Go has no remote push on Android.

## Push notifications

The backend sends through the free Expo push service, which forwards to Firebase Cloud Messaging.

- `google-services.json` from the Firebase project sits in the repo root and is committed.
- The Firebase service account key is uploaded on expo.dev under the project's Credentials → Android → FCM V1 service account key, and is never committed.

## Releasing

1. Bump `version` (semver) and `android.versionCode` in `app.json`.
2. Push to `main`. The `Android build` workflow builds the `preview` APK with `eas build --local` and attaches it to the run as an artifact. It needs the `EXPO_TOKEN` repository secret.
3. Upload the APK to Google Drive and send the link to the admin. Installing over the old APK keeps the login, because EAS signs every build with the same key.

## Installing on the admin's Xiaomi

After installing, open Settings → Apps → Manage apps → Массаж:

1. Autostart: on.
2. Battery saver: No restrictions.
3. Notifications: allowed, with floating and lock screen notifications on.

Then log in and tap "Отправить проверочное уведомление" in Профиль with the screen locked.
