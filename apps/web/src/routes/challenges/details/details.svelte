<script lang="ts">
  import { ChallengeScoringKind, type Challenge } from '@rctf/types'
  import EdgeFades from '$lib/components/edge-fades.svelte'
  import { IconFile, IconGlobeHemisphereWest, IconTrophy } from '$lib/icons'
  import Tabs from '$lib/ui/tabs.svelte'
  import type { Component } from 'svelte'
  import ChallengeDetailsHeader from './details-header.svelte'
  import ChallengeDetailsOverview from './overview.svelte'
  import ChallengeDetailsPodiumDynamic from './podium-dynamic.svelte'
  import ChallengeDetailsPodium from './podium.svelte'
  import ChallengeDetailsScores from './scores.svelte'
  import ChallengeDetailsSolves from './solves.svelte'
  import ChallengeDetailsSubmit from './submit.svelte'

  interface Props {
    challenge: Challenge | null
    isSolved: boolean
    onSolve: (challengeId: string) => void
    tab: string
    onTabChange: (tab: string) => void
  }

  let { challenge, isSolved, onSolve, tab, onTabChange }: Props = $props()

  type TabItem = {
    value: string
    label: string
    count?: number
    icon?: Component
  }

  const isDynamic = $derived(
    challenge?.scoringKind === ChallengeScoringKind.DYNAMIC
  )

  const tabItems = $derived.by((): TabItem[] => {
    if (!challenge) return []
    const items: TabItem[] = [
      { value: 'details', label: 'Details', icon: IconFile },
    ]
    if (challenge.hasFlag) {
      items.push({
        value: 'solves',
        label: 'Solves',
        count: challenge.solves,
        icon: IconTrophy,
      })
    } else if (isDynamic) {
      items.push({
        value: 'scores',
        label: 'Scores',
        count: challenge.solves,
        icon: IconGlobeHemisphereWest,
      })
    }
    return items
  })

  const activeTab = $derived(
    tabItems.some(item => item.value === tab) ? tab : 'details'
  )
</script>

{#if challenge}
  <challenge-details>
    <ChallengeDetailsHeader {challenge} {isSolved} />

    <details-tabs>
      <Tabs value={activeTab} onValueChange={onTabChange} tabs={tabItems}>
        {#snippet content({ value })}
          {#if value === activeTab && challenge}
            {#if value === 'details'}
              <details-viewport data-fade-scope>
                <details-scroll data-fade-source tabindex="-1">
                  <ChallengeDetailsOverview {challenge} {onSolve} />
                </details-scroll>
                <EdgeFades />
              </details-viewport>
            {:else if value === 'solves'}
              <ChallengeDetailsSolves {challenge} />
            {:else if value === 'scores'}
              <ChallengeDetailsScores {challenge} />
            {/if}
          {/if}
        {/snippet}
      </Tabs>
    </details-tabs>

    <details-footer>
      {#if activeTab === 'details' && challenge.hasFlag}
        <ChallengeDetailsPodium {challenge} {isSolved} />
      {:else if isDynamic && activeTab === 'details'}
        <ChallengeDetailsPodiumDynamic {challenge} />
      {/if}
      <ChallengeDetailsSubmit {challenge} {isSolved} {onSolve} />
    </details-footer>
  </challenge-details>
{:else}
  <challenge-details data-empty></challenge-details>
{/if}

<style>
  challenge-details {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    inline-size: min(100%, 60rem);
    block-size: calc(100% - 0.75rem);
    min-block-size: 0;
    min-inline-size: 0;
    margin-inline: auto;
    margin-block: 0.75rem 0;
    background: rgba(10, 22, 42, 0.94);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 12px;
    box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04);
    overflow: hidden;

    &[data-empty] {
      align-items: center;
      justify-content: center;
    }
  }

  details-tabs {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    block-size: 100%;
    min-block-size: 0;
    min-inline-size: 0;
    overflow: hidden;

    > :global([data-scope='tabs'][data-part='root']) {
      display: flex;
      flex: 1;
      flex-direction: column;
      block-size: 100%;
      min-block-size: 0;
    }

    :global([data-scope='tabs'][data-part='list']) {
      padding-inline: 1rem;
      background: rgba(8, 18, 34, 0.95);
      border-block-end: 1px solid rgba(56, 189, 248, 0.16);
    }

    :global([data-scope='tabs'][data-part='trigger']) {
      color: #94a3b8;
      background: transparent;
      border-radius: 6px 6px 0 0;
      font-size: 0.875rem;
      font-weight: 500;
      padding: 0.4rem 0.9rem;
      transition: all 0.12s ease;

      &[data-selected] {
        color: #f1f5f9;
        background: rgba(14, 28, 52, 0.9);
        box-shadow: inset 0 -2px 0 #38bdf8;
      }

      &:hover {
        color: #f1f5f9;
        background: rgba(56, 189, 248, 0.08);
      }
    }

    :global([data-scope='tabs'][data-part='content']:not([hidden])) {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-block-size: 0;
      overflow: hidden;
      background: rgba(10, 22, 42, 0.94);
      padding-block-end: 8rem;
    }
  }

  details-viewport {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    block-size: 100%;
    min-block-size: 0;
    max-block-size: 100%;
    overflow: hidden;
  }

  details-scroll {
    display: block;
    flex: 1 1 0;
    block-size: 0;
    min-block-size: 0;
    max-block-size: 100%;
    overflow-y: auto;
    overscroll-behavior: none;
    scrollbar-width: none;
    outline: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  details-footer {
    position: absolute;
    z-index: 2;
    inset-inline: 1rem;
    inset-block-end: 4rem;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    inline-size: auto;
    gap: 0.4rem;
    margin-block-end: 0;
    padding: 0.9rem 1rem 0;
    background: transparent;
  }
</style>
