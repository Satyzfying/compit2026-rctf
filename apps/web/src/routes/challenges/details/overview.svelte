<script lang="ts">
  import type { Challenge } from '@rctf/types'
  import Markdown from '$lib/components/markdown.svelte'
  import { IconDownload, IconFiles } from '$lib/icons'
  import { toast } from '$lib/toast'
  import Button from '$lib/ui/button.svelte'
  import Section from '$lib/ui/section.svelte'
  import Spinner from '$lib/ui/spinner.svelte'
  import { downloadAll } from '$lib/utils/download'
  import { formatFileSize } from '$lib/utils/filesize'
  import { onDestroy } from 'svelte'
  import ChallengeDetailsOverviewAdminbot from './overview-adminbot.svelte'
  import ChallengeDetailsOverviewInstancer from './overview-instancer.svelte'

  interface Props {
    challenge: Challenge
    onSolve: (challengeId: string) => void
  }

  let { challenge, onSolve }: Props = $props()

  let downloading = $state(false)
  let cancelDownload: (() => void) | null = null

  function handleDownloadAll() {
    downloading = true
    cancelDownload = downloadAll(challenge.files, {
      onDone: () => (downloading = false),
      onError: name => toast.error(`Couldn't start the download for ${name}`),
    })
  }

  onDestroy(() => cancelDownload?.())
</script>

<overview-content>
  <overview-grid>
    <Section title="Description">
      <Markdown content={challenge.description} />
    </Section>

    {#if challenge.files.length > 0}
      <Section title="Files">
        <files-box>
          <file-list tabindex="-1">
            {#each challenge.files as file (file.url)}
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                <IconFiles data-slot="icon" />
                <file-meta>
                  <span data-slot="name">{file.name}</span>
                  <span data-slot="size">{formatFileSize(file.size)}</span>
                </file-meta>
              </a>
            {/each}
          </file-list>
          {#if challenge.files.length > 1}
            <Button onclick={handleDownloadAll} disabled={downloading}>
              {#if downloading}
                <Spinner />
                Downloading…
              {:else}
                <IconDownload />
                Download all
              {/if}
            </Button>
          {/if}
        </files-box>
      </Section>
    {/if}

    {#if challenge.instancerLifetime != null}
      <Section title="Instancer">
        <ChallengeDetailsOverviewInstancer
          challengeId={challenge.id}
          instancerLifetime={challenge.instancerLifetime}
          instancerExtendable={challenge.instancerExtendable}
          instancerStoppable={challenge.instancerStoppable}
          instancerActions={challenge.instancerActions}
          {onSolve}
        />
      </Section>
    {/if}

    {#if challenge.adminBotInputs != null}
      <Section title="Admin bot">
        <ChallengeDetailsOverviewAdminbot
          challengeId={challenge.id}
          inputs={challenge.adminBotInputs}
        />
      </Section>
    {/if}
  </overview-grid>
</overview-content>

<style>
  overview-content {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.85rem 1.15rem;
    color: #e2e8f0;
    background: transparent;

    :global(ui-section) {
      background: rgba(8, 18, 36, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.16);
      border-radius: 8px;
    }

    :global(section-header) {
      color: #38bdf8;
      font-weight: 600;
      font-size: 0.9rem;
      background: rgba(12, 25, 48, 0.9);
      border-bottom: 1px solid rgba(56, 189, 248, 0.12);
      padding: 0.5rem 0.85rem;
    }

    :global(section-content) {
      background: transparent;
      padding: 0.85rem;
      color: #cbd5e1;
      font-size: 0.925rem;
      line-height: 1.6;
    }

    :global(code) {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(56, 189, 248, 0.2);
      color: #38bdf8;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-family: var(--font-mono, monospace);
      font-size: 0.875em;
    }
  }

  overview-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.75rem;

    @container (min-inline-size: 36rem) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    > :global(:last-child:nth-child(odd)) {
      grid-column: 1 / -1;
    }

    > :global(ui-section) {
      animation: overview-section-in 420ms cubic-bezier(0.22, 1, 0.36, 1)
        backwards;

      &:nth-child(odd) {
        --overview-offset: -1.5rem;
      }

      &:nth-child(even) {
        --overview-offset: 1.5rem;
        animation-delay: 90ms;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      > :global(ui-section) {
        animation: none;
      }
    }
  }

  @keyframes overview-section-in {
    from {
      opacity: 0;
      transform: translateX(var(--overview-offset, 0));
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  files-box {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
  }

  file-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-block-size: 12rem;
    overflow-y: auto;
    overscroll-behavior: none;

    a {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      color: #f1f5f9;
      text-decoration: none;
      background: rgba(10, 22, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.18);
      border-radius: 6px;
      transition: all 0.12s ease;

      &:hover {
        background: rgba(16, 34, 64, 0.9);
        border-color: rgba(56, 189, 248, 0.35);
      }

      &:focus-visible {
        outline: 2px solid #38bdf8;
        outline-offset: 0;
      }
    }

    :global([data-slot='icon']) {
      flex-shrink: 0;
      font-size: 1.125rem;
      color: #a3a9b8;
    }
  }

  file-meta {
    display: flex;
    flex-direction: column;
    min-inline-size: 0;

    [data-slot='name'] {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    [data-slot='size'] {
      color: var(--foreground-l3);
      font-size: var(--step--1);
    }
  }
</style>
