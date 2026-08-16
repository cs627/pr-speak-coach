# GitHub Export Record

## Repository

| 項目 | 結果 |
|---|---|
| 儲存庫 | `https://github.com/cs627/pr-speak-coach` |
| 可見度 | Private |
| 預設分支 | `main` |
| 建立原因 | 已連接身份 `cs627` 沒有在 `dickson-crypto` 組織建立 repository 的權限，因此依確認改為目前帳戶的私人儲存庫。 |

## Push audit

已檢查目前追蹤檔案與完整 Git 歷史。檢查涵蓋 `.env`、私鑰/憑證副檔名、常見 API Key 格式，以及 Azure Speech 和 OpenRouter 的帶值環境變數模式。結果未發現已追蹤的敏感檔名、金鑰模式或歷史提交命中。

應用程式密鑰不應寫入 Git。若日後加入任何外部服務，請只透過專案的安全環境變數管理介面設定，並在推送前重新執行此審計。
