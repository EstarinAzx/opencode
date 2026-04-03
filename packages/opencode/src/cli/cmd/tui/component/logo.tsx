import { For } from "solid-js"
import { useTheme } from "@tui/context/theme"
import { logo } from "@/cli/logo"

export function Logo() {
  const { theme } = useTheme()

  return (
    <box alignItems="center">
      <box>
        <For each={logo}>
          {(line) => (
            <text fg={theme.primary} selectable={false}>
              {line}
            </text>
          )}
        </For>
      </box>
      <box paddingTop={1}>
        <text fg={theme.accent} selectable={false}>{"N E U R A L   I N T E R F A C E"}</text>
      </box>
    </box>
  )
}
