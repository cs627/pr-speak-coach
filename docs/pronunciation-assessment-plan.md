# Professional Pronunciation Assessment Plan

## Product decision

PR Speak Coach 的目前版本採用**純瀏覽器卡拉OK式練習**。使用者朗讀指定句子後，瀏覽器語音辨識把轉寫文字與原句進行透明的逐字匹配；這能提供可見的重讀提示，但**不構成專業發音評測，也不能量度口音、音素或韻律**。使用者已確認不使用 Azure 或任何外部語音服務。

| 目前可提供的回饋 | 瀏覽器訊號 | 介面用法 |
|---|---|---|
| 闖關門檻 | 原句與轉寫的字詞匹配率 | 每句必須達到 90% 匹配才可繼續。 |
| 綠色字詞 | 完全匹配 | 代表瀏覽器轉寫含有該字詞。 |
| 橙色字詞 | 近似文字匹配 | 代表轉寫出現相近文字；建議放慢並再讀一次。 |
| 紅色字詞 | 未匹配 | 代表該原句字詞沒有在轉寫中出現；需要重讀。 |
| 播放高亮 | `SpeechSynthesisUtterance.onboundary` | 原聲示範播放時高亮目前字詞；個別瀏覽器不支援時仍可聽取完整示範。 |

## Interface rules

綠色、橙色與紅色僅代表**瀏覽器文字匹配狀態**，不能被解讀為「你真的發音準確／不準確」。特別是橙色只代表文字相似，而非語音學上的近音。介面會清楚保留這個限制。

目前闖關門檻為：至少 90% 原句字詞得到綠色完整匹配。出現紅色字詞時必須重讀。這是練習提示，不是語言資格考試或正式評核結果；結果會受瀏覽器辨識、錄音品質與環境噪音影響。

## Security and data flow

錄音只保留在瀏覽器內供使用者回放。現行版本不會上傳原始音檔，也不需要語音服務密鑰。已登入用戶只會保存練習結果、瀏覽器轉寫文字與逐字匹配回饋。

## Future professional assessment reference

若日後改變決定並啟用專業服務，Azure Speech Pronunciation Assessment 的 scripted assessment 可回傳完整度、準確度、流利度、韻律與逐字錯誤資料；相關研究文件保留在此作為未啟用的參考。[1] [2]

## References

[1]: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment "Azure Speech Pronunciation Assessment"
[2]: https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/speech-service/pronunciation-assessment/transparency-note-pronunciation-assessment "Microsoft Transparency Note for Pronunciation Assessment"
