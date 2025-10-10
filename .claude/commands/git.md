Commit all changes and push to GitHub main branch (auto-deploys to Vercel production).

Follow these steps:
1. Run `git status` to see all changes
2. Run `git diff` for staged and unstaged changes  
3. Run `git log -5 --oneline` to see recent commit style
4. Add all changes with `git add .` (verify no .env files first)
5. Create a comprehensive commit message with:
   - Brief summary (50 chars max)
   - Detailed bullet points of changes
   - Relevant file paths
   - End with Claude Code signature
6. Push to origin main with `git push origin main`
7. Confirm push succeeded with `git status`

Never commit .env files or secrets. Use commit message format:
```
[type]: [summary]

- [Change 1]
- [Change 2]  
- [File paths]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: feat, fix, docs, refactor, test, chore, perf, style
