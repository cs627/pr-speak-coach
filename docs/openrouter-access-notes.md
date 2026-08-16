# OpenRouter 访问排查笔记

核查日期：2026-08-16。

已在用户的默认 OpenRouter 工作区创建一个名称为 **PR Speak Coach · Server** 的专用 API Key，并设置 **US$0 总额度**。密钥只在创建时显示一次，未记录到项目文件、日志或文档中。

密钥列表显示该密钥未绑定 Guardrail；Guardrails 页面当前没有已配置的工作区规则。此前应用服务器对 OpenRouter 的模型目录与认证端点均收到 `403 Access denied by security policy`，因此问题暂时无法归因于该密钥的额度或 Guardrail 绑定。下一步应检查工作区 Routing 或账户层 Privacy / 安全设置；任何会改变数据共享、支付、模型路由或访问权限的配置都需要用户确认后才可提交。

Routing 页面显示 Auto Router 维持在低成本层，且存在允许模型列表（`anthropic/*`、`openai/gpt-4o`、`google/*`）。这项设置仅描述 `openrouter/auto` 的可选模型范围；本项目计划指定免费模型，因此不能单独解释认证端点的 403。OpenRouter 官方错误指南将 403 归类为密钥权限不足、Guardrail 拦截或内容审核等情况；当前仍应以账号级安全策略或实际密钥是否已成功写入应用环境为主要排查方向。
