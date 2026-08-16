# Guest Static Architecture

## Runtime model

GitHub Pages只提供公開靜態檔案。PR Speak Coach 的公開版本因此不會呼叫登入、資料庫、tRPC 或其他伺服器API；任何人打開頁面都會立即進入練習流程。

| Feature | Guest static implementation | Data location |
|---|---|---|
| Daily practice and PR scenarios | Bundled React content | Browser memory while open |
| XP, level, streak, recent practice dates | Browser state synchronized to `localStorage` | User’s current browser only |
| Reference speech | Browser Speech Synthesis using an English device voice | User device only |
| Recording and playback | Browser MediaRecorder | Current browser session only |
| Transcript match feedback | Browser Speech Recognition where supported | User device only |

## Explicit boundaries

There is no account sign-in or cross-device data synchronization in the GitHub Pages version. Clearing site data clears locally stored progress. The repository retains server files for future private hosting, but the static client entry no longer initializes the server-backed data client.
