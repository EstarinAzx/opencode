/**
 * /pr skill — One-command PR creation workflow.
 *
 * Detects current changes, creates a feature branch if on main/master,
 * commits all changes with a generated message, pushes, and outputs
 * the PR creation URL.
 */

import { registerBundledSkill } from "../registry.js"

const PR_PROMPT = `# PR: Create a Pull Request

Create a pull request from your current changes in one step.

## Steps

1. **Check git status** — Run \`git status\` to see current changes. If working tree is clean, tell the user there's nothing to PR.

2. **Check current branch** — Run \`git branch --show-current\`.
   - If on \`main\` or \`master\`, create a feature branch:
     - Generate a short, descriptive branch name from the changes (e.g., \`feat/add-memory-system\`)
     - Run \`git checkout -b <branch-name>\`
   - If already on a feature branch, stay on it.

3. **Stage all changes** — Run \`git add -A\`

4. **Generate commit message** — Analyze the staged changes with \`git diff --staged --stat\` and write a conventional commit message (feat/fix/refine/docs). Be concise but specific.

5. **Commit** — Run \`git commit -m "<message>"\`

6. **Push** — Run \`git push origin HEAD --no-verify\`

7. **Output PR URL** — Construct and display the GitHub PR creation URL:
   - Get the remote URL with \`git remote get-url origin\`
   - Parse the owner/repo from it
   - Output: \`https://github.com/<owner>/<repo>/compare/<default-branch>...<branch-name>?expand=1\`

## Rules
- If any step fails, explain the error and suggest a fix
- Use \`--no-verify\` on push to skip pre-push hooks
- Never force-push
- If there are merge conflicts, stop and report them
`

export function registerPrSkill(): void {
  registerBundledSkill({
    name: "pr",
    description: "Create a pull request — auto-branch, commit, push, and get the PR URL.",
    aliases: ["pullrequest", "pull-request"],
    userInvocable: true,
    async getPrompt(args) {
      const parts: string[] = [PR_PROMPT.trimStart()]
      if (args) {
        parts.push(`## Additional Context\n\n${args}`)
      }
      return parts.join("\n\n")
    },
  })
}
