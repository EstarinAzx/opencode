import { Prompt, type PromptRef } from "@tui/component/prompt"
import { createEffect, on, onMount } from "solid-js"
import { Logo } from "../component/logo"
import { useSync } from "../context/sync"
import { Toast } from "../ui/toast"
import { useArgs } from "../context/args"
import { useRouteData } from "@tui/context/route"
import { usePromptRef } from "../context/prompt"
import { useLocal } from "../context/local"
import { TuiPluginRuntime } from "../plugin"
import { useTheme } from "../context/theme"

// TODO: what is the best way to do this?
let once = false
const placeholder = {
  normal: ['Ask XETHRYON... "sh ./init_encryption.sh --force"', 'Ask XETHRYON... "scan project architecture"', 'Ask XETHRYON... "debug the failing subroutines"', 'Ask XETHRYON... "deploy hotfix to mainframe"'],
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
      <box flexGrow={1} alignItems="center" paddingLeft={2} paddingRight={2}>
        <box flexGrow={1} minHeight={0} />
        <box height={2} minHeight={0} flexShrink={1} />
        <box flexShrink={0}>
          <TuiPluginRuntime.Slot name="home_logo" mode="replace">
            <Logo />
          </TuiPluginRuntime.Slot>
        </box>
        <box height={2} minHeight={0} flexShrink={1} />
        <box width="100%" maxWidth={90} zIndex={1000} flexShrink={0}>
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
      <box width="100%" flexShrink={0}>
        <TuiPluginRuntime.Slot name="home_footer" mode="single_winner" />
      </box>
    </>
  )
}
