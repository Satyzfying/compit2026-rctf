<script lang="ts">
  import CtfNotStarted from '$lib/components/ctf-not-started.svelte'
  import { IconFlagBanner, IconSearch, IconTrophy } from '$lib/icons'
  import { useClientConfig } from '$lib/query/config'
  import EmptyState from '$lib/ui/empty-state.svelte'
  import Spinner from '$lib/ui/spinner.svelte'
  import ScoresLeaderboard from './leaderboard/leaderboard.svelte'
  import { createScoresData } from './model/data.svelte'
  import { createScoresRouteState } from './model/url-state.svelte'
  import ScoresScreenshotContainer from './screenshot/screenshot-container.svelte'
  import ScoresToolbar from './toolbar/toolbar.svelte'

  const configQuery = useClientConfig()
  const ctfName = $derived(configQuery.data?.ctfName)
  const divisions = $derived(configQuery.data?.divisions ?? {})
  const startTime = $derived(configQuery.data?.startTime ?? 0)

  const urlState = createScoresRouteState()

  const endTime = $derived(configQuery.data?.endTime ?? null)
  let currentTime = $state(Date.now())
  const freezeTime = $derived(
    endTime != null &&
      configQuery.data?.startTime != null &&
      currentTime >= configQuery.data.startTime &&
      currentTime >= endTime - 60 * 60 * 1000 &&
      currentTime < endTime
  )

  const data = createScoresData({
    division: () => urlState.division,
    search: () => urlState.search,
    sortMode: () => urlState.sortMode,
    focusedChallengeId: () => urlState.focusedChallengeId,
    showTop3Context: () => urlState.showTop3Context,
    showSelfContext: () => urlState.showSelfContext,
    freeze: () => freezeTime,
  })

  const revealAfterLoading = data.isLoading

  let screenshotOpen = $state(false)

  $effect(() => {
    const timer = window.setInterval(() => (currentTime = Date.now()), 1000)
    return () => window.clearInterval(timer)
  })

  const focusFetching = $derived(
    !!urlState.focusedChallengeId &&
      data.entries.length === 0 &&
      (data.hasNextPage || data.isFetchingNextPage)
  )
</script>

<svelte:head>
  {#if ctfName}
    <title>Scores | {ctfName}</title>
  {/if}
</svelte:head>

{#if data.isNotStarted}
  <CtfNotStarted />
{:else}
  <scores-page data-reveal>
    {#if freezeTime}<freeze-banner>Freeze time</freeze-banner>{/if}
    <ScoresToolbar
      {data}
      {urlState}
      {divisions}
      onScreenshot={() => (screenshotOpen = true)}
    />

    {#if data.isLoading || focusFetching}
      <scores-leaderboard-slot>
        <Spinner />
      </scores-leaderboard-slot>
    {:else if data.loadError && data.entries.length === 0}
      <scores-leaderboard-slot>
        <EmptyState
          icon={IconTrophy}
          title="Couldn't load the scoreboard"
          subtitle={data.loadError.message}
        />
      </scores-leaderboard-slot>
    {:else if data.entries.length > 0}
      <scores-frame data-reveal={revealAfterLoading || undefined}>
        <ScoresLeaderboard {data} {urlState} {divisions} {startTime} />
      </scores-frame>
    {:else}
      <scores-leaderboard-slot>
        {#if urlState.focusedChallengeId}
          <EmptyState
            icon={IconFlagBanner}
            title="No solves"
            subtitle="No matching teams have solved this challenge."
          />
        {:else if urlState.search}
          <EmptyState
            icon={IconSearch}
            title="No teams found"
            subtitle="Try a different search term."
          />
        {:else}
          <EmptyState
            icon={IconTrophy}
            title="No scores yet"
            subtitle="Check back once teams start solving."
          />
        {/if}
      </scores-leaderboard-slot>
    {/if}

    {#if screenshotOpen}
      <ScoresScreenshotContainer
        open={screenshotOpen}
        onOpenChange={open => (screenshotOpen = open)}
        {urlState}
        ctfName={ctfName ?? ''}
        {startTime}
        {endTime}
      />
    {/if}
  </scores-page>
{/if}

<style>
  scores-page {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-block-size: 0;
    block-size: calc(100dvh - var(--header-height) - 1.5rem);
    max-block-size: calc(100dvh - var(--header-height) - 1.5rem);
    overflow: hidden;
    padding-block-end: 1rem;
    /* background: linear-gradient(135deg, #0a2149 0%, #164a88 48%, #071a3a 100%); */
    background: transparent;
    opacity: 0;
    transform: translateY(18px);
    animation: score-page-reveal 500ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  freeze-banner {
    display: block;
    inline-size: fit-content;
    margin: 0 auto 0.5rem;
    padding: 0.35rem 0.8rem;
    color: #dbeafe;
    background: rgb(7 21 47 / 0.88);
    border: 1px solid rgb(94 157 202 / 0.5);
    border-radius: 999px;
  }

  @keyframes score-page-reveal {
    0% {
      opacity: 0;
      transform: translateY(18px);
      filter: blur(4px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
      filter: blur(0);
    }
  }

  scores-frame {
    display: flex;
    flex: 1;
    justify-content: center;
    min-block-size: 0;
    max-inline-size: 100%;
    padding-inline: 1rem;

    @media (width >= 48rem) {
      padding-inline: 2.25rem;
    }
  }

  scores-leaderboard-slot {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    min-block-size: 0;
  }
</style>
