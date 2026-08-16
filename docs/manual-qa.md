# Manual QA Checklist

## Browser session validation — 2026-08-16

在已认证的真实浏览器会话中打开 PR Speak Coach，确认首页能读取账户身份并呈现 Beginner、0 XP、连续学习徽章、每日流程、PR情境库和完成区。页面内容完整加载，没有运行时错误。

| 流程 | 验证状态 | 说明 |
|---|---|---|
| 已认证仪表盘加载 | 已通过 | 账户名称、等级、每日会话和情境库均出现。 |
| 小聊转写与规则化复盘 | 逻辑与界面已验证 | 单元测试覆盖规则评分与持久化路由；真实浏览器页面锚点可更新，但扩展在向底部滚动时超时，未对账户写入示例数据。 |
| 浏览器试听 | 待人工试听 | 需要设备声音输出，必须由用户在自己的设备上确认。 |
| 麦克风许可、录音、回放与重试 | 待人工验证 | 浏览器权限弹窗与硬件麦克风不能由自动化代为授权。 |
| 手机端布局 | 已通过视觉检查 | 已完成390px截图检查，未发现溢出。 |

## Recommended user-side device check

1. 点击 **Listen first**，确认所选浏览器声音可听见且语速舒适。
2. 点击 **Record my voice**，允许麦克风权限，朗读句子后点击 **Stop**；确认可播放录音，再点击 **Try again**。
3. 在 **Small Talk Room** 点击 **Speak my response**，说出两到四句回应；确认浏览器转写出现后点击 **Review my small talk**。
4. 完成三段 Shadowing 與小聊復盤，點擊 **Complete session**；刷新頁面，確認 XP、Streak、熱力圖和解鎖狀態仍被保留。

## Browser-only karaoke verification

1. 在 Chrome 或 Edge 點擊 **Listen first**，確認播放時字詞依次反白；若設備不提供字詞邊界事件，完整示範聲音仍應可播放。
2. 點擊 **Record my voice**，朗讀原句後停止。確認轉寫比對結果中，完整匹配為綠色、相近文字為橙色、沒有辨識到的字詞為紅色。
3. 嘗試略過一個字詞，確認 **Pass & continue** 保持停用；重新錄讀，直到至少 90% 字詞綠色匹配後才可通過。
4. 確認介面始終將回饋標示為 browser recognition，而不會聲稱提供專業發音、音素、口音或韻律分數。
