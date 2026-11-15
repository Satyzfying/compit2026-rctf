<script lang="ts">
  import type { Challenge } from '@rctf/types'
  import { IconCaretDown, IconQuestion } from '$lib/icons'
  import Accordion from '$lib/ui/accordion.svelte'
  import EmptyState from '$lib/ui/empty-state.svelte'
  import { getCategoryConfig } from '$lib/utils/categories'
  import ChallengesListHeader from './list-header.svelte'
  import ChallengesListItem from './list-item.svelte'
  import { onMount } from 'svelte'
  import {
    computeStats,
    deriveAccordionValue,
    filterChallenges,
    groupChallenges,
    resolveCategory,
  } from './list-logic'
  import { loadPreferences, savePreferences } from './preferences'

  interface Props {
    challenges: Challenge[]
    solvedIds: ReadonlySet<string>
    bloodIds: { gold: Set<string>; silver: Set<string>; bronze: Set<string> }
    selectedId: string | null
    onSelect: (challenge: Challenge) => void
    deepLinkTarget: string | null
    canManageChallenges: boolean
  }

  let {
    challenges,
    solvedIds,
    bloodIds,
    selectedId,
    onSelect,
    deepLinkTarget,
    canManageChallenges,
  }: Props = $props()

  const initialPrefs = loadPreferences()
  let searchQuery = $state('')
  let hideSolved = $state(initialPrefs.hideSolved)
  let collapsedCategories = $state<string[]>(initialPrefs.collapsedCategories)
  let hiddenChallengeIds = $state<Set<string>>(new Set())
  let removedChallengeIds = $state<Set<string>>(new Set())
  let listElement = $state<HTMLElement | null>(null)
  let scrollDirection = $state<'up' | 'down' | null>(null)
  let adjustingLoopScroll = false
  let previousLoopScrollTop = 0

  function hideChallenge(challenge: Challenge) {
    hiddenChallengeIds = new Set(hiddenChallengeIds)
    hiddenChallengeIds.add(challenge.id)
  }

  function deleteChallenge(challenge: Challenge) {
    removedChallengeIds = new Set(removedChallengeIds)
    removedChallengeIds.add(challenge.id)
    hiddenChallengeIds = new Set(hiddenChallengeIds)
    hiddenChallengeIds.add(challenge.id)
  }

  const searching = $derived(searchQuery.trim().length > 0)

  const visibleChallenges = $derived.by(() => {
    const filtered = challenges.filter(
      challenge =>
        !hiddenChallengeIds.has(challenge.id) && !removedChallengeIds.has(challenge.id)
    )
    const searched = filterChallenges(filtered, {
      query: searchQuery,
      hideSolved: false,
      solvedIds,
    })
    if (!hideSolved) return searched
    return searched.filter(
      challenge =>
        challenge.id === deepLinkTarget || !solvedIds.has(challenge.id)
    )
  })

  const groups = $derived(groupChallenges(visibleChallenges))
  const groupByCategory = $derived(
    new Map(groups.map(group => [group.category, group]))
  )
  const allCategories = $derived(groups.map(group => group.category))
  const orderedChallenges = $derived(
    allCategories.flatMap(
      category => groupByCategory.get(category)?.challenges ?? []
    )
  )

  const deepLinkCategory = $derived.by(() => {
    if (!deepLinkTarget) return null
    const target = challenges.find(challenge => challenge.id === deepLinkTarget)
    return target ? resolveCategory(target.category) : null
  })

  const accordionValue = $derived(
    deriveAccordionValue({
      allCategories,
      collapsedCategories,
      searching,
      deepLinkCategory,
    })
  )
  const anyOpen = $derived(accordionValue.length > 0)

  const stats = $derived(computeStats(challenges, solvedIds))

  const emptySubtitle = $derived.by(() => {
    if (searching && hideSolved)
      return 'Try a different search or show solved challenges'
    if (searching) return 'Try a different search term'
    if (hideSolved) return 'All challenges have been solved!'
    return 'No challenges available'
  })

  function bloodTierOf(id: string): 'gold' | 'silver' | 'bronze' | null {
    if (bloodIds.gold.has(id)) return 'gold'
    if (bloodIds.silver.has(id)) return 'silver'
    if (bloodIds.bronze.has(id)) return 'bronze'
    return null
  }

  function toggleHideSolved() {
    hideSolved = !hideSolved
    savePreferences({ hideSolved, collapsedCategories })
  }

  function handleValueChange(open: string[]) {
    if (searching) return
    const openSet = new Set(open)
    const before = new Set(accordionValue)
    const next = [...collapsedCategories]
    let changed = false
    for (const category of allCategories) {
      const nowOpen = openSet.has(category)
      if (nowOpen === before.has(category)) continue
      const index = next.indexOf(category)
      if (nowOpen && index !== -1) {
        next.splice(index, 1)
        changed = true
      } else if (!nowOpen && index === -1) {
        next.push(category)
        changed = true
      }
    }
    if (changed) {
      collapsedCategories = next
      savePreferences({ hideSolved, collapsedCategories: next })
    }
  }

  function toggleCollapseAll() {
    const rendered = new Set(allCategories)
    const preserved = collapsedCategories.filter(
      category => !rendered.has(category)
    )
    const next = anyOpen ? [...preserved, ...allCategories] : preserved
    const deduped = [...new Set(next)]
    collapsedCategories = deduped
    savePreferences({ hideSolved, collapsedCategories: deduped })
  }

  function moveSelectedChallenge(delta: number) {
    if (orderedChallenges.length === 0) return

    const currentIndex = selectedId
      ? orderedChallenges.findIndex(challenge => challenge.id === selectedId)
      : -1
    const safeIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex = Math.min(
      Math.max(safeIndex + delta, 0),
      orderedChallenges.length - 1
    )
    const nextChallenge = orderedChallenges[nextIndex]
    if (!nextChallenge) return

    onSelect(nextChallenge)
    const nextButton = document.getElementById(`chall-${nextChallenge.id}`)?.querySelector<HTMLButtonElement>('.challenge-select')
    nextButton?.focus()
  }

  function handleListKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey)
      return

    const target = event.target instanceof Element ? event.target : null
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return

    const key = event.key.toLowerCase()
    if (key !== 'w' && key !== 's') return

    event.preventDefault()
    moveSelectedChallenge(key === 'w' ? -1 : 1)
  }

  function handleListScroll(event: Event) {
    const element = event.currentTarget as HTMLElement
    const currentScrollTop = element.scrollTop
    if (currentScrollTop !== previousLoopScrollTop) {
      scrollDirection =
        currentScrollTop > previousLoopScrollTop ? 'down' : 'up'
    }
    const cycles = element.querySelectorAll<HTMLElement>('[data-wheel-cycle]')
    if (cycles.length >= 2 && !adjustingLoopScroll) {
      const getFirstChallengeTop = (cycle: HTMLElement) => {
        const item = cycle.querySelector<HTMLElement>('li[data-wheel-item]')
        if (!item) return null
        const listBounds = element.getBoundingClientRect()
        return item.getBoundingClientRect().top - listBounds.top + element.scrollTop
      }
      const firstCycle = cycles[0]
      const secondCycle = cycles[1]
      if (!firstCycle || !secondCycle) return

      const firstCycleTop = getFirstChallengeTop(firstCycle)
      const secondCycleTop = getFirstChallengeTop(secondCycle)

      if (firstCycleTop !== null && secondCycleTop !== null) {
        const cycleHeight = secondCycleTop - firstCycleTop
        if (cycleHeight <= 0) return

        let nextScrollTop = element.scrollTop
        const scrollingUp = element.scrollTop < previousLoopScrollTop
        const scrollingDown = element.scrollTop > previousLoopScrollTop

        if (scrollingUp && nextScrollTop < firstCycleTop) {
          while (nextScrollTop < firstCycleTop) nextScrollTop += cycleHeight
        } else if (scrollingDown && nextScrollTop >= secondCycleTop) {
          while (nextScrollTop >= secondCycleTop) nextScrollTop -= cycleHeight
        }

        if (nextScrollTop !== element.scrollTop) {
          adjustingLoopScroll = true
          element.classList.add('is-loop-adjusting')
          element.scrollTop = nextScrollTop
          previousLoopScrollTop = nextScrollTop
          requestAnimationFrame(() => {
            element.classList.remove('is-loop-adjusting')
            adjustingLoopScroll = false
          })
        }
      }
    }
    previousLoopScrollTop = element.scrollTop
    updateWheelItems(element)
  }

  function updateWheelItems(element: HTMLElement) {
    if (!selectedId) {
      for (const item of element.querySelectorAll<HTMLElement>('[data-wheel-item]')) {
        item.style.setProperty('--wheel-x', '0px')
        item.style.setProperty('--wheel-rotate', '0deg')
        item.style.setProperty('--wheel-scale', '1')
        item.style.setProperty('--wheel-opacity', '1')
      }
      return
    }

    const bounds = element.getBoundingClientRect()
    const center = bounds.top + bounds.height / 2
    const radius = Math.max(240, bounds.height * 0.72)

    for (const item of element.querySelectorAll<HTMLElement>('[data-wheel-item]')) {
      const itemBounds = item.getBoundingClientRect()
      const distance =
        (itemBounds.top + itemBounds.height / 2 - center) / (bounds.height / 2)
      const normalized = Math.max(-1, Math.min(1, distance))
      const curve = Math.sqrt(Math.max(0, 1 - normalized * normalized))
      const translateX = -48 + curve * Math.min(110, radius * 0.28)
      const rotate = normalized * -24
      const scale = 0.84 + curve * 0.1
      const opacity = 0.58 + curve * 0.42

      item.style.setProperty('--wheel-x', `${translateX.toFixed(2)}px`)
      item.style.setProperty('--wheel-rotate', `${rotate.toFixed(2)}deg`)
      item.style.setProperty('--wheel-scale', scale.toFixed(3))
      item.style.setProperty('--wheel-opacity', opacity.toFixed(3))
    }
  }

  onMount(() => {
    const frame = requestAnimationFrame(() => {
      if (listElement) updateWheelItems(listElement)
    })
    return () => cancelAnimationFrame(frame)
  })

  $effect(() => {
    void selectedId
    const frame = requestAnimationFrame(() => {
      if (listElement) updateWheelItems(listElement)
    })
    return () => cancelAnimationFrame(frame)
  })

  $effect(() => {
    if (!listElement || !selectedId) return
    const frame = requestAnimationFrame(() => {
      if (listElement) updateWheelItems(listElement)
    })
    return () => cancelAnimationFrame(frame)
  })
</script>

<challenges-list data-has-selection={selectedId ? 'true' : undefined}>
  <ChallengesListHeader
    pointsEarned={stats.pointsEarned}
    pointsTotal={stats.pointsTotal}
    solvedCount={stats.solvedCount}
    totalCount={stats.totalCount}
    {searchQuery}
    {hideSolved}
    {anyOpen}
    onSearchChange={value => (searchQuery = value)}
    onToggleHideSolved={toggleHideSolved}
    onToggleCollapse={toggleCollapseAll}
  />

  <list-scroll
    bind:this={listElement}
    data-scroll-direction={scrollDirection ?? undefined}
    role="listbox"
    aria-label="Challenges list"
    tabindex="-1"
    onkeydown={handleListKeydown}
    onscroll={handleListScroll}
  >
    {#if groups.length === 0}
      <EmptyState
        icon={IconQuestion}
        title="No challenges found"
        subtitle={emptySubtitle}
      />
    {:else}
      <div data-wheel-cycle>
        <Accordion
          items={allCategories}
          value={accordionValue}
          onValueChange={handleValueChange}
        >
        {#snippet header({ value, props, expanded })}
          {@const config = getCategoryConfig(value)}
          {@const entries = groupByCategory.get(value)?.challenges ?? []}
          {@const solvedInCategory = entries.filter(c =>
            solvedIds.has(c.id)
          ).length}
          <challenges-list-group-header
            data-category-color={config.color}
            data-wheel-item
          >
            <button {...props} data-expanded={expanded || undefined}>
              <config.icon data-slot="icon" />
              <span data-slot="name">{config.name}</span>
              <span data-slot="count">
                <strong>{solvedInCategory}</strong> / {entries.length}
              </span>
              <IconCaretDown data-slot="chevron" />
            </button>
          </challenges-list-group-header>
        {/snippet}

        {#snippet content({ value, props })}
          {@const config = getCategoryConfig(value)}
          {@const entries = groupByCategory.get(value)?.challenges ?? []}
          <challenges-list-group-body
            data-category-color={config.color}
            {...props}
          >
            <ul>
              {#each entries as challenge (challenge.id)}
                <ChallengesListItem
                  {challenge}
                  category={value}
                  solved={solvedIds.has(challenge.id)}
                  bloodTier={bloodTierOf(challenge.id)}
                  selected={selectedId === challenge.id}
                  canManageChallenges={canManageChallenges}
                  onSelect={() => onSelect(challenge)}
                  onHideChallenge={hideChallenge}
                  onDeleteChallenge={deleteChallenge}
                />
              {/each}
            </ul>
          </challenges-list-group-body>
        {/snippet}
        </Accordion>
      </div>

      <div data-wheel-cycle>
      {#each groups as group (group.category)}
        {@const config = getCategoryConfig(group.category)}
        <challenges-list-group-header
          data-category-color={config.color}
          data-wheel-item
          data-loop-copy
        >
          <button type="button" aria-label={`${config.name} category copy`}>
            <config.icon data-slot="icon" />
            <span data-slot="name">{config.name}</span>
            <span data-slot="count">
              <strong>{group.challenges.filter(c => solvedIds.has(c.id)).length}</strong>
              / {group.challenges.length}
            </span>
            <IconCaretDown data-slot="chevron" />
          </button>
        </challenges-list-group-header>
        <challenges-list-group-body
          data-category-color={config.color}
          data-loop-copy
        >
          {#if accordionValue.includes(group.category)}
            <ul>
              {#each group.challenges as challenge (challenge.id)}
                <ChallengesListItem
                  {challenge}
                  category={group.category}
                  solved={solvedIds.has(challenge.id)}
                  bloodTier={bloodTierOf(challenge.id)}
                  selected={selectedId === challenge.id}
                  canManageChallenges={canManageChallenges}
                  idPrefix="loop-"
                  onSelect={() => onSelect(challenge)}
                  onHideChallenge={hideChallenge}
                  onDeleteChallenge={deleteChallenge}
                />
              {/each}
            </ul>
          {/if}
        </challenges-list-group-body>
      {/each}
      </div>
    {/if}
  </list-scroll>
</challenges-list>

<style>
  challenges-list {
    container-type: inline-size;
    container-name: challenges-list;
    display: flex;
    flex: 1;
    flex-direction: column;
    min-block-size: 0;
    background: transparent;
  }

  list-scroll {
    flex: 1;
    min-block-size: 0;
    overflow-y: auto;
    overscroll-behavior: none;
    scrollbar-width: none;
    perspective: 1100px;
    perspective-origin: 0 50%;
    padding: 1.25rem 1.25rem 2rem 1.25rem;

    &::before {
      content: '';
      display: block;
      block-size: 50%;
      min-block-size: 12rem;
    }

    &::after {
      content: '';
      display: block;
      block-size: 50%;
      min-block-size: 12rem;
    }

    &::-webkit-scrollbar {
      display: none;
    }

    &.is-loop-adjusting :global([data-wheel-item]) {
      transition-duration: 0ms;
    }
  }

  challenges-list-group-header {
    display: block;
    margin-block-end: 0.375rem;
    background: transparent;
    transform: translateX(var(--wheel-x, 0px))
      rotateY(var(--wheel-rotate, 0deg)) scale(var(--wheel-scale, 1));
    opacity: var(--wheel-opacity, 1);
    transition: transform 90ms linear, opacity 90ms linear;
    inline-size: calc(100% - 1rem);

    button {
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      align-items: center;
      gap: 0.625rem;
      inline-size: 100%;
      padding: 0.625rem 0.75rem 0.625rem 0.875rem;
      text-align: start;
      color: var(--category-foreground-l1);
      background: transparent;
      border: 1px solid transparent;
      border-radius: 999px;
      cursor: pointer;
      /* box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03); */

      &:focus-visible {
        outline: 2px solid var(--ring);
        outline-offset: -2px;
      }

      &[data-expanded] :global([data-slot='chevron']) {
        rotate: 0deg;
      }
    }

    :global([data-slot='icon']) {
      flex-shrink: 0;
      font-size: 1rem;
    }

    [data-slot='name'] {
      font-size: var(--step-0);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    [data-slot='count'] {
      margin-inline-start: auto;
      color: var(--category-foreground-l1);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;

      strong {
        color: var(--category-foreground-l0);
        font-weight: var(--font-weight-normal);
      }
    }

    :global([data-slot='chevron']) {
      flex-shrink: 0;
      font-size: 1rem;
      color: var(--category-foreground-l1);
      rotate: -90deg;
      transition: rotate 150ms ease;
    }
  }

  challenges-list-group-body {
    display: block;
    background: transparent;

    ul {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin: 0;
      padding: 0.5rem 0.25rem 1rem;
      list-style: none;
    }
  }
</style>
