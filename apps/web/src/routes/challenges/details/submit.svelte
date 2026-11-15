<script lang="ts">
  import {
    BadAlreadySolvedChallenge,
    GoodFlag,
    SubmitFlagRoute,
    type Challenge,
  } from '@rctf/types'
  import { showApiError } from '$lib/api'
  import { useApiForm } from '$lib/forms/use-api-form.svelte'
  import {
    IconCheck,
    IconInfo,
    IconPaperPlaneTilt,
    IconSignIn,
  } from '$lib/icons'
  import { useClientConfig } from '$lib/query/config'
  import { useCurrentUser } from '$lib/query/user'
  import { toast } from '$lib/toast'
  import Button from '$lib/ui/button.svelte'
  import Dialog from '$lib/ui/dialog.svelte'
  import Input from '$lib/ui/input.svelte'
  import Spinner from '$lib/ui/spinner.svelte'
  import { resolveSubmitState } from './submit-ladder'

  interface Props {
    challenge: Challenge
    isSolved: boolean
    onSolve: (challengeId: string) => void
  }

  let { challenge, isSolved, onSolve }: Props = $props()

  const configQuery = useClientConfig()
  const clientConfig = $derived(configQuery.data)
  const isArchived = $derived(clientConfig?.isArchived ?? false)
  const flagPlaceholder = $derived(
    clientConfig?.flagFormatPlaceholder ?? 'flag{...}'
  )

  const endTime = $derived(clientConfig?.endTime ?? Number.POSITIVE_INFINITY)

  const userQuery = useCurrentUser()
  const isAuthenticated = $derived(userQuery.data != null)

  let now = $state(Date.now())

  const submitState = $derived(
    resolveSubmitState({ isArchived, endTime, now, isAuthenticated, isSolved })
  )

  $effect(() => {
    if (submitState === 'archived' || submitState === 'ended') return
    const interval = setInterval(() => (now = Date.now()), 1000)
    return () => clearInterval(interval)
  })

  let submitDialogOpen = $state(false)

  const form = useApiForm(SubmitFlagRoute, {
    onSuccess: response => {
      if (response.kind === GoodFlag.kind) {
        toast.success('Flag correct!')
        onSolve(challenge.id)
        submitDialogOpen = false
        form.setData({ flag: '', solverFile: '', aiSolver: '' })
      } else if (response.kind === BadAlreadySolvedChallenge.kind) {
        toast.info('You already solved this challenge')
        onSolve(challenge.id)
        submitDialogOpen = false
      }
    },
    onError: response => {
      showApiError(response)
    },
  })

  $effect(() => {
    form.data.id = challenge.id
  })

  function isSafeHttpUrl(value: string): boolean {
    if (!value) return false
    try {
      const url = new URL(value)
      return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname
    } catch {
      return false
    }
  }

  function isSafeUploadedSolverFile(file: File | null): boolean {
    if (!file) return true

    const allowedExtensions = [
      '.txt',
      '.py',
      '.js',
      '.ts',
      '.json',
      '.md',
      '.rs',
      '.go',
      '.java',
      '.c',
      '.cc',
      '.cpp',
      '.cs',
      '.sh',
      '.bash',
    ]

    const fileName = file.name.toLowerCase()
    const isAllowedExt = allowedExtensions.some(ext => fileName.endsWith(ext))
    const isTextLike = file.type === '' || file.type.startsWith('text/') || file.type === 'application/json'
    const isSmallEnough = file.size <= 1024 * 1024

    return isAllowedExt && isTextLike && isSmallEnough
  }

  function handleSolverFileChange(event: Event & { currentTarget: HTMLInputElement }) {
    const file = event.currentTarget.files?.[0] ?? null

    if (!file) {
      form.setData({ solverFile: '' })
      return
    }

    if (!isSafeUploadedSolverFile(file)) {
      toast.error('Only small text-based solver files are allowed. No executables or archives.')
      event.currentTarget.value = ''
      form.setData({ solverFile: '' })
      return
    }

    form.setData({ solverFile: file.name })
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    const flag = (form.data.flag ?? '').trim()
    if (!flag) return

    const solverFile = (form.data.solverFile ?? '').trim()
    const aiSolverInput = (form.data.aiSolver ?? '').trim()

    if (aiSolverInput && aiSolverInput.toLowerCase() !== 'i did not use ai') {
      if (!isSafeHttpUrl(aiSolverInput)) {
        toast.error('AI solver must be a valid http(s) URL or the exact text "i did not use ai".')
        return
      }
    }

    form.setData({
      flag,
      solverFile,
      aiSolver: aiSolverInput || 'i did not use ai',
    })
    form.submit()
  }
</script>

<challenge-submit>
  {#if submitState === 'archived'}
    <submit-notice>
      <IconInfo />
      <span>The CTF is archived.</span>
    </submit-notice>
  {:else if submitState === 'ended'}
    <submit-notice>
      <IconInfo />
      <span>The CTF has ended.</span>
    </submit-notice>
  {:else if submitState === 'login'}
    <Button href="/login">
      <IconSignIn />
      Login to submit
    </Button>
  {:else}
    {#if submitState === 'solved'}
      <submit-notice data-tone="success">
        <IconCheck />
        <span>Challenge solved!</span>
      </submit-notice>
    {:else}
      <Button
        type="button"
        variant="secondary"
        onclick={() => (submitDialogOpen = true)}
        disabled={form.submitting}
      >
        Submit flag
      </Button>
      <Dialog
        bind:open={submitDialogOpen}
        title="Submit flag"
        description="Attach a solver file, add your AI disclosure, and submit the flag."
      >
        {#snippet children({ closeProps })}
          <form class="submit-dialog-form" onsubmit={handleSubmit}>
            <field-group>
              <label for="solver-file-input">Solver file</label>
              <input
                id="solver-file-input"
                type="file"
                accept=".txt,.py,.js,.ts,.json,.md,.rs,.go,.java,.c,.cc,.cpp,.cs,.sh,.bash"
                aria-label="Solver file"
                data-solver-file-input
                disabled={form.submitting}
                onchange={handleSolverFileChange}
              />
              {#if form.data.solverFile}
                <small>{form.data.solverFile}</small>
              {/if}
            </field-group>

            <field-group>
              <label for="ai-solver-input">AI solver link or 'i did not use ai'</label>
              <Input
                id="ai-solver-input"
                type="text"
                placeholder="http://ididnotuseai or https://example.com/solver"
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
                data-ai-solver-input
                aria-label="AI solver disclosure"
                disabled={form.submitting}
                bind:value={form.data.aiSolver}
              />
            </field-group>

            <field-group>
              <label for="flag-input">Flag</label>
              <Input
                id="flag-input"
                type="text"
                placeholder={flagPlaceholder}
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
                data-flag-input
                aria-label="Flag"
                aria-invalid={!!form.errors._form || undefined}
                disabled={form.submitting}
                bind:value={form.data.flag}
              />
            </field-group>

            <dialog-actions>
              <Button type="button" variant="secondary" {...closeProps}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.submitting}>
                {#if form.submitting}
                  <Spinner />
                  Submitting
                {:else}
                  <IconPaperPlaneTilt />
                  Submit
                {/if}
              </Button>
            </dialog-actions>
          </form>
        {/snippet}
      </Dialog>
    {/if}
  {/if}
</challenge-submit>

<style>
  challenge-submit {
    display: block;
    --submit-block-size: 2.5rem;

    > :global(button),
    > :global(a[data-variant]) {
      color: #d9fbff;
      /* background: linear-gradient(135deg, #174f73, #226a7b); */
      border: 1px solid rgb(100 218 220 / 42%);
      box-shadow: 0 0.25rem 0.8rem rgb(4 24 54 / 28%);

      &:hover:enabled {
        background: linear-gradient(135deg, #226b8d, #2a8290);
      }
    }

    :global(a[data-variant]) {
      gap: 0.5rem;
      inline-size: 100%;
      block-size: var(--submit-block-size);
      font-size: 1rem;
    }
  }

  form {
    display: block;
  }

  challenge-submit {
    display: block;
  }

  .submit-dialog-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-inline-size: min(28rem, 100%);
  }

  field-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    color: var(--foreground-l3);
    font-size: 0.95rem;

    :global(input[data-ai-solver-input]),
    :global(input[data-flag-input]) {
      min-inline-size: 0;
      block-size: var(--submit-block-size);
      font-size: 1rem;
      border-radius: var(--radius-lg);
    }

    :global(input[data-flag-input]) {
      font-family: var(--font-mono);
      font-size: 1.25rem;
    }

    :global(input[data-solver-file-input]) {
      min-inline-size: 0;
      block-size: auto;
      border-radius: var(--radius-lg);
      padding: 0.5rem;
      background: var(--background-l4);
    }

    small {
      color: var(--foreground-l2);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-block-start: 0.5rem;
  }

  submit-notice {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.75rem;
    min-inline-size: 0;
    block-size: var(--submit-block-size);
    padding-inline: 0.75rem;
    font-size: 0.875rem;
    color: #ededed;
    background: #1a1e28;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;

    &[data-tone='success'] {
      color: #4cc38a;
      background: rgba(76, 195, 138, 0.1);
      border-color: rgba(76, 195, 138, 0.25);
    }

    span {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    :global(svg) {
      flex-shrink: 0;
      inline-size: 1.125rem;
      block-size: 1.125rem;
    }
  }

  :global(button) {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    padding-inline: 1.15rem;
    block-size: var(--submit-block-size);
    color: #ffffff;
    font-weight: 500;
    background: #0284c7;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.15s ease;
  }

  :global(button:hover:enabled) {
    background: #0369a1;
  }

  :global(button:active:enabled) {
    transform: scale(0.98);
  }

  :global(button:focus-visible) {
    outline: 2px solid var(--ring);
  }

  :global(button:disabled) {
    cursor: not-allowed;
    opacity: 0.5;
  }

  :global(button svg) {
    inline-size: 1.5rem;
    block-size: 1.5rem;
  }
</style>
