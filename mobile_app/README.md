# 329 MIS Mobile App

Flutter mobile app for committee members, following `docs/PROMPT_MOBILE_APP.md`.

## Phase 1

- Login with mock API and secure storage for token, user, and projectId
- Bottom navigation: ภาพรวม, งานของฉัน, อัปโหลด, แจ้งเตือน, โปรไฟล์
- Overview KPI and personal KPI
- My Work list with filters
- Task detail with subtasks and evidence
- Subtask progress/status update when the current user owns the subtask
- Evidence upload flow with required caption, 10 MB limit, and jpg/png/pdf support
- Notifications list and mark as read
- Profile edit and logout
- Thai UI and Buddhist Era dates

## Phase 2

- Task comments in Task Detail with author and Buddhist Era timestamp
- Committee Lead task status update through the mock API interface for `PATCH /api/tasks/[id]`
- Evidence review buttons for reviewer roles with approve/reject and rejection reason
- Pull-to-refresh on list/detail screens
- Notification deep link to Task Detail
- Toast messages for save/review/comment outcomes

## Phase 3

- Switched the app provider to `DioMobileApi`
- Reads `API_BASE_URL` from `.env`
- Uses NextAuth credentials flow with CSRF + session cookie
- Stores the session cookie as the mobile token in secure storage
- Connects real endpoints:
  - `PATCH /api/subtasks/[id]`
  - `POST /api/evidence/upload`
  - `GET/PATCH /api/notifications`
  - `PATCH /api/users/me`
  - `GET /api/tasks/export?format=json`
  - `GET/POST /api/tasks/[id]/comments`
  - `PATCH /api/tasks/[id]`
  - `POST /api/evidence/review`
- Handles `401`, `403`, and `400` with Thai messages and logout on expired session

## Phase 4

- Splash screen with 329 logo
- Thai empty states for no tasks and no notifications
- Loading skeletons instead of plain spinners
- Offline banner: `ไม่มีการเชื่อมต่อ`
- Draft upload caption saved before successful upload
- Android/iOS app name: `329 MIS`
- Generated 329 launcher icons
- Android release build config in `android/app/build.gradle`

## Run

```powershell
cd mobile_app
flutter pub get
flutter run
```

If platform files are missing:

```powershell
cd mobile_app
flutter create --platforms=android,ios .
```

## Build APK

Release builds **must** be signed with a real upload keystore — the build refuses to sign a release with the debug key.

1. Create a keystore once and keep it safe (losing it means the installed app can no longer be updated):
   ```powershell
   keytool -genkey -v -keystore "$env:USERPROFILE\329-upload-keystore.jks" -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. Create `android/key.properties` (gitignored):
   ```properties
   storePassword=...
   keyPassword=...
   keyAlias=upload
   storeFile=C:/Users/<you>/329-upload-keystore.jks
   ```
3. Build:
   ```powershell
   cd mobile_app
   flutter build apk --release
   ```

Release APK output:

```text
build/app/outputs/flutter-apk/app-release.apk
```

## API base URL

Release builds use production `https://329.cnppai.com` (`.env` and the fallback in `lib/core/app_config.dart`).
For local development override it — the Android emulator reaches the host at `10.0.2.2`:

```powershell
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

Plain `http://` is allowed only in debug builds (`android/app/src/debug/AndroidManifest.xml`).

The app uses `DioMobileApi` by default. `MockMobileApi` remains available for offline demos.

## Test accounts

Seed defaults (see `docs/USERS.md`) — change them on any internet-facing server:

| Username | Password | Role |
| --- | --- | --- |
| ops_staff | Pass329! | Task Owner |
| ops_lead | Pass329! | Committee Lead |
| director | password123 | Project Director |
