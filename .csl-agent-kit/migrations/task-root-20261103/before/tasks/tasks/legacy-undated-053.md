# 在 Pi 中安装 Caveman 和 Ponytail

## 计划

- [x] 记录当前 Pi package/settings 状态，并确认目标资源尚未安装。
- [x] 通过官方原生 Pi package 安装 Ponytail。
- [x] 从现有可信 Codex plugin 源中只安装 Caveman 主回答风格 skill。
- [x] 验证 Pi package 注册、Caveman 发现路径、源文件完整性和目标资源冲突。

## 复核

- 通过 `pi install git:github.com/DietrichGebert/ponytail` 安装 Ponytail 4.8.4；Pi settings 和 `pi list` 均已登记该 package。
- 创建 `~/.pi/agent/skills/caveman` 软链接，只暴露主 `caveman` skill；未安装 `caveman-stats`、`cavecrew` 或 `caveman-compress`。
- Pi RPC `get_commands` 实际发现 `/ponytail`、全部 Ponytail 扩展命令、`/skill:ponytail*` 和 `/skill:caveman`。
- Ponytail 的 Pi extension 专项测试 23/23 通过，目标资源没有名称冲突。
- Ponytail 上游完整测试 82 项中 81 项通过；唯一失败是 correctness benchmark 需要本机未安装的 Python `pandas`，与 Pi extension 加载无关，未擅自修改全局 Python 环境。
- 当前 Pi 会话需要执行 `/reload`，或重启 Pi，才能加载新资源。
