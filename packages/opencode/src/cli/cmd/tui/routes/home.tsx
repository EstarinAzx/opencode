import { Prompt, type PromptRef } from "@tui/component/prompt"
import { createEffect, createMemo, on, onMount, Show } from "solid-js"
import { Logo } from "../component/logo"
import { useSync } from "../context/sync"
import { Toast } from "../ui/toast"
import { useArgs } from "../context/args"
import { useRouteData } from "@tui/context/route"
import { usePromptRef } from "../context/prompt"
import { useLocal } from "../context/local"
import { TuiPluginRuntime } from "../plugin"
import { useTheme } from "../context/theme"
import { Installation } from "@/installation"

// TODO: what is the best way to do this?
let once = false
const placeholder = {
  normal: ["Patch the corrupted module", "Scan project architecture", "Debug the failing subroutines", "Decrypt the codebase structure", "Deploy hotfix to mainframe"],
  shell: ["ls -la", "git status", "pwd"],
}

export function Home() {
  const sync = useSync()
  const route = useRouteData("home")
  const promptRef = usePromptRef()
  let prompt: PromptRef | undefined
  const args = useArgs()
  const local = useLocal()
  const { theme } = useTheme()

  const providerCount = createMemo(() => sync.data.provider.length)
  const sessionCount = createMemo(() => sync.data.session.length)

  onMount(() => {
    if (once) return
    if (!prompt) return
    if (route.initialPrompt) {
      prompt.set(route.initialPrompt)
      once = true
    } else if (args.prompt) {
      prompt.set({ input: args.prompt, parts: [] })
      once = true
    }
  })

  // Wait for sync and model store to be ready before auto-submitting --prompt
  createEffect(
    on(
      () => sync.ready && local.model.ready,
      (ready) => {
        if (!ready) return
        if (!prompt) return
        if (!args.prompt) return
        if (prompt.current?.input !== args.prompt) return
        prompt.submit()
      },
    ),
  )

  return (
    <>
      <box flexGrow={1} paddingLeft={2} paddingRight={2}>
        <box flexGrow={1} flexDirection="row">
          {/* Left gutter - decorative */}
          <box width={1} flexShrink={0}>
            <text fg={theme.primary} selectable={false}>{"║"}</text>
          </box>

          {/* Main content area */}
          <box flexGrow={1} alignItems="center" paddingLeft={1} paddingRight={1}>
            <box flexGrow={1} minHeight={0} />

            {/* System status panel */}
            <box flexShrink={0} width="100%" maxWidth={90} alignItems="center">
              <box flexDirection="row" gap={2} flexShrink={0}>
                <text fg={theme.primary} selectable={false}>{"╔══"}</text>
                <text fg={theme.textMuted} selectable={false}>{"SYSTEM STATUS"}</text>
                <text fg={theme.primary} selectable={false}>{"══╗"}</text>
              </box>
              <box flexDirection="row" gap={3} paddingTop={1} paddingBottom={1} justifyContent="center">
                <text fg={theme.textMuted}>
                  <span style={{ fg: providerCount() > 0 ? theme.success : theme.textMuted }}>●</span>{" PROVIDERS: "}{providerCount()}
                </text>
                <text fg={theme.textMuted}>
                  <span style={{ fg: sessionCount() > 0 ? theme.accent : theme.textMuted }}>●</span>{" SESSIONS: "}{sessionCount()}
                </text>
                <text fg={theme.textMuted}>
                  <span style={{ fg: theme.primary }}>●</span>{" v"}{Installation.VERSION}
                </text>
              </box>
            </box>

            <box height={1} minHeight={0} flexShrink={1} />

            {/* Logo */}
            <box flexShrink={0}>
              <TuiPluginRuntime.Slot name="home_logo" mode="replace">
                <Logo />
              </TuiPluginRuntime.Slot>
            </box>

            <box height={1} minHeight={0} flexShrink={1} />

            {/* Prompt */}
            <box width="100%" maxWidth={90} zIndex={1000} paddingTop={1} flexShrink={0}>
              <TuiPluginRuntime.Slot name="home_prompt" mode="replace" workspace_id={route.workspaceID}>
                <Prompt
                  ref={(r) => {
                    prompt = r
                    promptRef.set(r)
                  }}
                  workspaceID={route.workspaceID}
                  placeholders={placeholder}
                />
              </TuiPluginRuntime.Slot>
            </box>
            <TuiPluginRuntime.Slot name="home_bottom" />
            <box flexGrow={1} minHeight={0} />
            <Toast />
          </box>

          {/* Right gutter - decorative */}
          <box width={1} flexShrink={0}>
            <text fg={theme.primary} selectable={false}>{"║"}</text>
          </box>
        </box>

        {/* Bottom decorative line */}
        <box flexShrink={0} flexDirection="row" width="100%">
          <text fg={theme.primary} selectable={false}>{"╚"}</text>
          <box flexGrow={1}>
            <text fg={theme.primary} selectable={false}>{"═".repeat(200)}</text>
          </box>
          <text fg={theme.primary} selectable={false}>{"╝"}</text>
        </box>
      </box>
      <box width="100%" flexShrink={0}>
        <TuiPluginRuntime.Slot name="home_footer" mode="single_winner" />
      </box>
    </>
  )
}
