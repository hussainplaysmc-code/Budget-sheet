# Pocket Ledger

A mobile-first budget app for Android. Create separate lists, record income and expenses, search and filter transactions, set a spending budget, and see totals and category breakdowns. The first list contains clearly labelled example transactions; create a new list or edit the example to get started.

## Run in a browser

```sh
npm install
npm run dev
```

The browser preview stores data in browser local storage. It is useful for development, but does not share data with the Android app.

## Build for Android

Requirements: Node.js 20 or newer, Android Studio, and an Android SDK. Open the `android` directory in Android Studio after syncing the web assets:

```sh
npm install
npm run android:sync
npx cap open android
```

Run on an Android device or emulator, or use Android Studio's **Build > Build APK(s)** to produce a debug APK. Repeat `npm run android:sync` after making web changes before building. A release build requires your own signing key.

## Storage and privacy

On Android, lists are saved locally using Capacitor Preferences (Android SharedPreferences); no account or backend is required. Data is specific to the device and app installation. Clearing app data or uninstalling the app can remove the lists, so do not use this as the only copy of important financial records. The app works offline after installation.
