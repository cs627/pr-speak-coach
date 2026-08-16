# Azure Speech 成本核查

核查日期：2026-08-16。

Azure Speech 的 F0 免费层包含每月 **5 个音频小时**的标准实时语音转文字额度，并提供每月 **50 万字符**的神经文本转语音额度。Azure 官方定价页说明，语音转文字的免费音频时数在标准与自定义转写间共享；免费额度并不等同于无限制的语音评测服务。[1]

Azure 官方的发音评测文档明确说明，Pronunciation Assessment 的使用成本与标准或承诺层语音转文字相同。[2] 因此，适合先用 F0 额度验证个人日常训练体验；当评测使用量超出免费额度或需要稳定的生产级容量时，需启用按量付费。当前定价页列示标准实时转写为每音频小时 1 美元，而实时韵律评测增强功能另为每音频小时 0.30 美元；区域、货币与实际合约会影响最终费用。[1]

针对本应用，建议把 Azure 用在短句评分与高质量示范音频上，并保留浏览器内置语音试听作为无需外部配置的展示模式。若只供一个人每日 15 分钟使用，免费的 5 小时音频转写额度大约相当于每月 20 天、每天 15 分钟的总录音量；实际可用时长仍会因重试和韵律评测而下降，不能把它当作固定承诺。

## References

[1] [Azure Speech in Foundry Tools pricing](https://azure.microsoft.com/en-us/pricing/details/speech/)

[2] [Microsoft Learn: Use pronunciation assessment](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment)
