# PR Speak Coach

PR Speak Coach 是一個給公關及商務溝通人士使用的瀏覽器英語口語練習網站。它提供每日練習流程、PR 情境小聊、卡拉OK式字詞高亮、瀏覽器語音辨識的逐字匹配，以及本機進度保存。

## Public site

GitHub Pages 發布完成後，網站網址為：

`https://cs627.github.io/pr-speak-coach/`

任何人都可以直接開啟並使用，不需要帳戶或登入。

## Privacy and progress

練習進度、XP、連續學習日數與完成日期只保存在使用者目前瀏覽器的 `localStorage`。清除瀏覽器網站資料、更換瀏覽器或更換裝置後，這些本地進度不會自動同步。錄音只保留在目前頁面中供回放，不會上傳到伺服器。

## Browser requirements

建議使用最新版 Chrome 或 Edge，以獲得較完整的麥克風錄音、英文語音辨識與逐字高亮支援。示範聲音取自裝置已安裝的英語系統聲音；若裝置沒有可用英文聲音，播放按鈕會安全停用，而不會改用不合適的預設語音。

> 綠、橙、紅字是瀏覽器轉寫的文字匹配提示，不是專業音素、口音或韻律評測。

## Development

```bash
pnpm install
pnpm dev
```

本機驗證：

```bash
pnpm test --run
pnpm check
pnpm build:pages
```

GitHub Pages 目前以 repository 的 `gh-pages` 分支根目錄作為發布來源。每次更新後，請重新執行 `pnpm build:pages`，並把 `dist/public` 的靜態輸出更新至 `gh-pages` 分支。
