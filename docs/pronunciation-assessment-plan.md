# Professional Pronunciation Assessment Plan

## Product decision

PR Speak Coach 將採用 **Azure Speech Pronunciation Assessment 的 scripted assessment** 來評測使用者朗讀的指定句子。此模式可把錄音與原句對照，回傳整體與逐字評分，適合「讀得好才可以過關」的練習方式。[1]

| 需要的回饋 | 服務訊號 | 介面用法 |
|---|---|---|
| 整體過關分數 | `PronScore` | 每句的闖關門檻。 |
| 準確度 | `AccuracyScore` | 顯示字音與目標發音的接近程度。 |
| 流利度 | `FluencyScore` | 說明不自然的停頓或斷裂。 |
| 韻律 | `ProsodyScore` | 顯示重音、語調、節奏與語速的自然度；僅限 `en-US`。 |
| 完整度 | `CompletenessScore` | 顯示是否漏讀目標句中的單字。 |
| 逐字錯誤 | `ErrorType`、單字分數、`Offset`、`Duration` | 為卡拉OK字詞加上綠、橙、紅色與播放時間點。 |

## Interface rules

綠色表示表現良好；橙色表示低於建議準確度、需要再試；紅色表示 `Mispronunciation`、`Omission` 或嚴重低分。`Insertion` 會在句子尾部顯示額外提示，避免把不存在的單字硬塞進原文。播放錄音時，依 `Offset` 與 `Duration` 讓當前字詞出現卡拉OK高亮。

初始建議門檻為：整體分數至少 78、完整度至少 92、任何漏讀或錯讀單字需要重試。此為學習闖關門檻，不是語言資格考試或正式評核結果；評測會受錄音品質、環境噪音與說話者差異影響。[2]

## Security and data flow

瀏覽器只把授權後錄製的音檔傳至本應用伺服器。伺服器保有 Azure Speech Key 與 Region，呼叫 Azure 取得結構化評測結果後，只保存分數、逐字回饋與必要的文字資料；原始音檔不會持久保存。密鑰不可放在瀏覽器或前端程式碼。

## References

[1]: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment "Azure Speech Pronunciation Assessment"
[2]: https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/speech-service/pronunciation-assessment/transparency-note-pronunciation-assessment "Microsoft Transparency Note for Pronunciation Assessment"
