Please generate tasks from the PRD using /.claude/generate-tasks.md

If not explicitly told which PRD to use, generate a list of PRDs and ask the user to select one under `/tasks` or create a new one using `/create-prd`:
- assume it's stored under `/tasks` and has a filename starting with `[n]-prd-` (e.g., `0001-prd-[name].md`)
- it should not already have a corresponding task list in `/tasks` (e.g., `tasks-0001-prd-[name].md`)
- **always** ask the user to confirm the PRD file name before proceeding

Make sure to provide options in number lists so I can respond easily (if multiple options).
