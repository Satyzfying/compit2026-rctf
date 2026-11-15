<script lang="ts">
  import { Permissions, type Challenge } from '@rctf/types'
  import { useQueryClient } from '@tanstack/svelte-query'
  import { afterNavigate, pushState, replaceState } from '$app/navigation'
  import { page } from '$app/state'
  import {
    deriveBloodIds,
    deriveSolvedIds,
    invalidateAfterSolve,
    useChallenges,
  } from '$lib/query/challenges'
  import { useCurrentUser } from '$lib/query/user'
  import { useClientConfig } from '$lib/query/config'
  import { hasPermissions } from '$lib/utils/permissions'
  import Dialog from '$lib/ui/dialog.svelte'
  import Splitter from '$lib/ui/splitter.svelte'
  import { handlePaneArrowKey } from '$lib/utils/pane-keynav'
  import { tick } from 'svelte'
  import { SvelteSet } from 'svelte/reactivity'
  import ChallengeDetails from './details/details.svelte'
  import ChallengesList from './list/list.svelte'
  import {
    getDeepLinkId,
    resolveClose,
    type CloseSource,
  } from './model/drawer-history'

  type ChallengeListProps = {
    challenges: Challenge[]
    solvedIds: ReadonlySet<string>
    bloodIds: { gold: Set<string>; silver: Set<string>; bronze: Set<string> }
    selectedId: string | null
    onSelect: (challenge: Challenge) => void
    deepLinkTarget: string | null
    canManageChallenges: boolean
  }
  type ChallengeDetailProps = {
    challenge: Challenge | null
    isSolved: boolean
    onSolve: (challengeId: string) => void
    tab: string
    onTabChange: (tab: string) => void
  }

  const DESKTOP_MIN_WIDTH = 768
  const WIDE_MIN_WIDTH = 1280

  const queryClient = useQueryClient()
  const challengesQuery = useChallenges()
  const userQuery = useCurrentUser()
  const configQuery = useClientConfig()

  const challenges = $derived(challengesQuery.data ?? [])
  const challengeIds = $derived(new Set(challenges.map(c => c.id)))
  const selfSolves = $derived(userQuery.data?.solves)
  const canManageChallenges = $derived(
    hasPermissions(userQuery.data, Permissions.challsWrite)
  )

  const localSolvedIds = new SvelteSet<string>()
  const solvedIds = $derived(deriveSolvedIds(selfSolves, localSolvedIds))
  const bloodIds = $derived(deriveBloodIds(selfSolves))

  let selectedId = $state<string | null>(null)
  let detailsTab = $state('details')
  let listOpen = $state(true)
  let deepLinkTarget = $state<string | null>(null)
  let innerWidth = $state(0)
  let routerReady = $state(false)
  let pendingDrawerId = $state<string | null>(null)
  let currentTime = $state(Date.now())
  const freezeTime = $derived(
    configQuery.data?.endTime != null &&
      configQuery.data?.startTime != null &&
      currentTime >= configQuery.data.startTime &&
      currentTime >= configQuery.data.endTime - 60 * 60 * 1000 &&
      currentTime < configQuery.data.endTime
  )

  $effect(() => {
    const timer = window.setInterval(() => (currentTime = Date.now()), 1000)
    return () => window.clearInterval(timer)
  })

  const isMobile = $derived(innerWidth > 0 && innerWidth < DESKTOP_MIN_WIDTH)
  const listMinSize = $derived(innerWidth < WIDE_MIN_WIDTH ? 40 : 20)

  const selectedChallenge = $derived(
    selectedId ? (challenges.find(c => c.id === selectedId) ?? null) : null
  )
  const selectedIsSolved = $derived(
    selectedChallenge ? solvedIds.has(selectedChallenge.id) : false
  )

  const drawerOpen = $derived(
    isMobile && selectedId !== null && page.state.challengeDrawer === true
  )
  const showDetailPane = $derived(selectedId !== null)

  function challengeUrl(id: string): string {
    const url = new URL(page.url)
    url.searchParams.set('challenge', id)
    return `${url.pathname}${url.search}`
  }

  function openDrawer(id: string) {
    pushState(challengeUrl(id), { challengeDrawer: true })
  }

  function closeDrawer(source: CloseSource) {
    if (
      resolveClose(source, page.state.challengeDrawer === true) ===
      'history-back'
    ) {
      history.back()
    }
  }

  function handleSelect(challenge: Challenge) {
    if (selectedId === challenge.id) {
      selectedId = null
      if (isMobile) {
        closeDrawer('programmatic')
      } else {
        const url = new URL(page.url)
        url.searchParams.delete('challenge')
        replaceState(`${url.pathname}${url.search}`, { ...page.state })
      }
      return
    }

    selectedId = challenge.id
    if (!isMobile) {
      replaceState(challengeUrl(challenge.id), { ...page.state })
    } else if (page.state.challengeDrawer === true) {
      replaceState(challengeUrl(challenge.id), { challengeDrawer: true })
    } else {
      openDrawer(challenge.id)
    }
  }

  function handleDrawerOpenChange(open: boolean) {
    if (!open) closeDrawer('backdrop')
  }

  function handleSolve(challengeId: string) {
    invalidateAfterSolve(queryClient, challengeId, id => localSolvedIds.add(id))
  }

  function scrollToRow(id: string, attempts = 60) {
    const el = document.getElementById(`chall-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'instant', block: 'center' })
    } else if (attempts > 0) {
      requestAnimationFrame(() => scrollToRow(id, attempts - 1))
    }
  }

  let latched = $state(false)
  $effect(() => {
    if (latched || challenges.length === 0 || innerWidth === 0) return

    const id = getDeepLinkId(page.url, challengeIds)
    if (id) {
      selectedId = id
      deepLinkTarget = id
      pendingDrawerId = isMobile ? id : null
      void tick().then(() => scrollToRow(id))
    }
    latched = true
  })

  afterNavigate(() => {
    routerReady = true
    if (pendingDrawerId && isMobile && page.state.challengeDrawer !== true) {
      const id = pendingDrawerId
      pendingDrawerId = null
      openDrawer(id)
    }
  })

  let wasMobile = $state(false)
  $effect(() => {
    const mobile = isMobile
    if (wasMobile === mobile) return
    wasMobile = mobile
    if (!mobile) {
      if (page.state.challengeDrawer === true) closeDrawer('resize-to-desktop')
    } else if (
      routerReady &&
      selectedId &&
      page.state.challengeDrawer !== true
    ) {
      openDrawer(selectedId)
    }
  })

  const listProps = $derived<ChallengeListProps>({
    challenges,
    solvedIds,
    bloodIds,
    selectedId: selectedChallenge?.id ?? null,
    onSelect: handleSelect,
    deepLinkTarget,
    canManageChallenges,
  })
  const detailProps = $derived<ChallengeDetailProps>({
    challenge: selectedChallenge,
    isSolved: selectedIsSolved,
    onSolve: handleSolve,
    tab: detailsTab,
    onTabChange: tab => (detailsTab = tab),
  })
</script>

<svelte:window bind:innerWidth />

{#snippet listPane(props: ChallengeListProps)}
  <challenges-list-slot>
    <ChallengesList {...props} />
  </challenges-list-slot>
{/snippet}

{#snippet detailPane(props: ChallengeDetailProps)}
  <challenges-detail-slot>
    {#if props.challenge}
      {#key props.challenge.id}
        <challenge-detail-animator>
          <ChallengeDetails {...props} />
        </challenge-detail-animator>
      {/key}
    {/if}
  </challenges-detail-slot>
{/snippet}

{#if isMobile}
  <challenges-page data-form="mobile">
    {#if freezeTime}<freeze-banner>Freeze time</freeze-banner>{/if}
    <pane-surface data-side="list">{@render listPane(listProps)}</pane-surface>
    <Dialog
      open={drawerOpen}
      onOpenChange={handleDrawerOpenChange}
      title={selectedChallenge?.name ?? 'Challenge details'}
      titleHidden
      presentation="drawer"
      flush
    >
      <drawer-body tabindex="-1">{@render detailPane(detailProps)}</drawer-body>
    </Dialog>
  </challenges-page>
{:else}
  <challenges-page
    data-form="desktop"
    role="region"
    aria-label="Challenge list and detail view"
  >
    {#if freezeTime}<freeze-banner>Freeze time</freeze-banner>{/if}
    <button
      class="challenge-menu-toggle"
      type="button"
      aria-label={listOpen ? 'Hide challenge menu' : 'Show challenge menu'}
      data-menu-open={listOpen ? 'true' : 'false'}
      onmouseenter={() => (listOpen = !listOpen)}
    >
      <span aria-hidden="true">{listOpen ? '>' : '<'}</span>
    </button>

    <div class="challenge-layout" data-menu-open={listOpen ? 'true' : 'false'}>
      {#if showDetailPane}
        <Splitter
          panels={[
            { id: 'list', minSize: listMinSize, maxSize: 50 },
            { id: 'detail', minSize: 40 },
          ]}
          defaultSize={[40, 60]}
        >
          {#snippet a()}
            <pane-surface data-side="list">{@render listPane(listProps)}</pane-surface>
          {/snippet}
          {#snippet b()}
            <pane-surface data-side="detail">{@render detailPane(detailProps)}</pane-surface>
          {/snippet}
        </Splitter>
      {:else}
        <pane-surface data-side="list">{@render listPane(listProps)}</pane-surface>
      {/if}
    </div>
  </challenges-page>
{/if}

<style>
  challenges-page {
    position: relative;
    isolation: isolate;
    display: flex;
    block-size: calc(100dvh - var(--header-height));
    min-block-size: 0;
    inline-size: 100%;
    --splitter-handle-size: 0.5rem;

    &[data-form='mobile'] {
      flex-direction: column;

      pane-surface[data-side='list'] {
        flex: 1;
        min-block-size: 0;
        border-start-end-radius: 0;
      }
    }
  }

  freeze-banner {
    position: absolute;
    z-index: 60;
    inset-block-start: 0.5rem;
    inset-inline-start: 50%;
    padding: 0.35rem 0.8rem;
    color: #dbeafe;
    background: rgb(7 21 47 / 0.88);
    border: 1px solid rgb(94 157 202 / 0.5);
    border-radius: 999px;
    box-shadow: 0 0.5rem 1rem rgb(0 0 0 / 0.2);
    translate: -50% 0;
  }

  @keyframes challenges-background-drift {
    from {
      background-position: 0% 15%;
    }

    to {
      background-position: 100% 85%;
    }
  }

  pane-surface {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    block-size: 100%;
    min-block-size: 0;
    min-inline-size: 0;
    overflow: hidden;
    background: linear-gradient(
      135deg,
      color-mix(in oklab, #03126b8a 46%, rgba(6, 128, 71, 0.678) 5%),
      color-mix(in oklab, #caf0f8 38%, transparent)
    );

    &[data-side='list'] {
      border-start-end-radius: var(--radius-3xl);
      border-end-end-radius: var(--radius-3xl);
      background: color-mix(in oklab, #89c2d957 30%, transparent);
        /* linear-gradient(
          135deg,
          #07152f 0%,
          #10284a 48%,
          #050b1c 100%,
          transparent 75%
        ); */
      background-size: 180% 180%;
      animation: challenges-background-drift 22s ease-in-out infinite alternate;
    }

    &[data-side='detail'] {
      border-start-start-radius: var(--radius-3xl);
      border-end-start-radius: var(--radius-3xl);
      background: transparent;
    }

  }

  .challenge-layout {
    display: flex;
    flex: 1;
    min-block-size: 0;
    min-inline-size: 0;
    opacity: 1;
    transform: translateX(0);
    transition:
      transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 260ms ease;

    &[data-menu-open='false'] {
      pointer-events: none;
      opacity: 0;
      transform: translateX(-100%);
    }
  }

  .challenge-menu-toggle {
    position: absolute;
    z-index: 50;
    inset-block-start: 50%;
    inset-inline-start: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 4rem;
    block-size: 6rem;
    padding: 0;
    color: skyblue;
    background: linear-gradient(
      135deg,
      color-mix(in oklab, #2733778a 35%, rgba(33, 133, 86, 0.596) 25%),
      color-mix(in oklab, #caf0f8 40%, transparent)
    );
    border: 1px solid color-mix(in oklab, rgba(3, 23, 136, 0.76) 26%, transparent);
    border-start-start-radius: 0;
    border-end-start-radius: 0;
    border-start-end-radius: 999px;
    border-end-end-radius: 999px;
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(13, 52, 85, 0.32);
    pointer-events: auto;
    transform: translateY(-50%);
    font-size: 2.5rem;

    &[data-menu-open='false'] {
      background: linear-gradient(
        135deg,
        color-mix(in oklab, #2733778a 35%, rgba(33, 133, 86, 0.596) 25%),
        color-mix(in oklab, #caf0f8 40%, transparent)
      );
    }

    &:hover {
      background: rgba(11, 235, 224, 0.507);
    }

    &:focus-visible {
      outline: 2px solid var(--ring);
      outline-offset: 2px;
    }

    :global(svg) {
      font-size: 12rem;
    }
  }

  challenges-list-slot,
  challenges-detail-slot {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-block-size: 0;
  }

  challenges-detail-slot {
    align-items: stretch;
    justify-content: stretch;
  }

  challenge-detail-animator {
    display: flex;
    flex: 1;
    min-block-size: 0;
    animation: challenge-detail-slide 280ms cubic-bezier(0.22, 1, 0.36, 1);
    transform-origin: right center;
  }

  @keyframes challenge-detail-slide {
    from {
      opacity: 0;
      transform: translateX(18px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  drawer-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-block-size: 0;
    overflow: auto;
    overscroll-behavior: none;
  }

  :global([data-presentation='drawer']) {
    --dialog-drawer-max-size: 85dvh;
  }
</style>
