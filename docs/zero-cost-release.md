# Zero-Cost Release Boundary

PR Speak Coach 的初始发布版本**不调用 Azure Speech 或 OpenRouter**。这一选择来自已确认的零外部 AI 成本要求，而不是把浏览器练习能力误称为专业语音评测。

| 能力 | 初始发布版本 | 后续可选升级 |
|---|---|---|
| 听力示范 | 浏览器 Web Speech API，优先选择可用的美式英语声音 | Azure neural TTS，固定服务端语音配置 |
| 跟读录音 | 浏览器麦克风录制、本地回放与重试 | 保持浏览器录音；可增加安全的服务器端音频处理 |
| 逐词反馈 | 支持时使用浏览器语音识别进行词汇匹配，清楚标注其边界 | Azure Pronunciation Assessment 的准确度、流利度、韵律与完整度评分 |
| 小聊复盘 | 浏览器转写优先，使用明确的规则检查语境、暖场、开放式问题和个人连接 | 服务器端 OpenRouter 模型给予上下文表达反馈 |

浏览器语音可用性与声音名称取决于用户设备、浏览器和操作系统。因此界面不承诺单一的“30岁男性”固定音色，而是以“American English preferred”显示可见的准确限制。

此前创建了 `PR Speak Coach · Server` 专用 OpenRouter Key，并将额度设为 US$0。然而，应用服务器对认证端点和一次真实免费模型调用均收到 `403 Access denied by security policy`。Guardrails、API Key 和 Routing 的可见设置已检查，未发现安全的进一步修复操作。由于初始版本不依赖该服务，密钥不会在当前代码路径中使用。若未来重新启用，应先在 OpenRouter 账户支持流程中解决该 403，再添加服务器端模型调用。
