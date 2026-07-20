# Baoyu Skills Wiki Collection

## Plan

- [x] 读取用户 tips，确认 wiki 文档保存到本地 MyWiki 目录。
- [x] 只读检查 `JimLiu/baoyu-skills` 仓库权限和当前 commit。
- [x] 抽取远端仓库 skill 清单与 frontmatter 描述。
- [x] 写入中文收藏文档到 wiki 目录。
- [x] 打开生成的 Markdown 文件并校验路径。

## Review

- 已创建 wiki 文档：`/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/我收藏的 Agent Skills - baoyu-skills.md`
- 文档来源：`https://github.com/JimLiu/baoyu-skills`，采集 commit `c9a50cc`。
- 文档包含推荐安装组合、公众号文章工作流、内容采集、视觉生成、发布分发、工具类和 21 个 skill 的完整索引。
- GitHub repo 当前对本机账号权限为 `READ`，没有直接推送远端 wiki。
- 已按 tips 用 Typora 打开生成的 Markdown 文件。

Verification performed:

- `gh repo view jimliu/baoyu-skills --json nameWithOwner,url,description,defaultBranchRef,viewerPermission,hasWikiEnabled`
- `git clone --depth 1 https://github.com/jimliu/baoyu-skills.git /tmp/baoyu-skills`
- `find /tmp/baoyu-skills -maxdepth 3 -type f -name SKILL.md`
- `rg -n '^\| `baoyu-' "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/我收藏的 Agent Skills - baoyu-skills.md"`
- `wc -l "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/我收藏的 Agent Skills - baoyu-skills.md"`
- `open -a Typora "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/我收藏的 Agent Skills - baoyu-skills.md"`
- `git diff --check -- tasks/todo.md`
