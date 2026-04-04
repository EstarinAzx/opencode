/**
 * Minimal YAML frontmatter parser.
 * Replaces cc-leak's `utils/frontmatterParser.js`.
 *
 * Input: raw markdown string
 * Output: { data: Record<string, string>, content: string }
 */

export interface FrontmatterResult {
  data: Record<string, string>
  content: string
}

/**
 * Parse YAML frontmatter from a markdown string.
 * Expects `---\n` delimiters. Returns empty data if no frontmatter found.
 */
export function parseFrontmatter(raw: string): FrontmatterResult {
  if (!raw.startsWith('---\n') && !raw.startsWith('---\r\n')) {
    return { data: {}, content: raw }
  }

  const lineBreak = raw.includes('\r\n') ? '\r\n' : '\n'
  const endIdx = raw.indexOf(`${lineBreak}---`, 4)
  if (endIdx === -1) {
    return { data: {}, content: raw }
  }

  const frontmatterBlock = raw.slice(raw.indexOf(lineBreak) + lineBreak.length, endIdx)
  const content = raw.slice(endIdx + lineBreak.length + 3).replace(/^\r?\n/, '')

  const data: Record<string, string> = {}
  for (const line of frontmatterBlock.split(lineBreak)) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim()
    if (key) data[key] = value
  }

  return { data, content }
}
