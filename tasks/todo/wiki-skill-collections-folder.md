# Wiki Skill Collections Folder

## Plan

- [x] Create a dedicated local wiki folder for future skill collection docs.
- [x] Move the existing `baoyu-skills` collection doc into that folder.
- [x] Verify the new path and open the moved document.

## Review

- Created `/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/Agent Skill Collections`.
- Moved the existing `baoyu-skills` collection doc into that folder.
- Future agent skill collection wiki docs should go in this folder.

Verification performed:

- `ls -la "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/Agent Skill Collections"`
- `wc -l "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/Agent Skill Collections/我收藏的 Agent Skills - baoyu-skills.md"`
- `open -a Typora "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/Agent Skill Collections/我收藏的 Agent Skills - baoyu-skills.md"`
- `git diff --check -- tasks/todo.md`
