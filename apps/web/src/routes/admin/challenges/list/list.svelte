<script lang="ts">
  import { Permissions, type AdminChallenge } from '@rctf/types'
  import { mergeProps } from '@zag-js/svelte'
  import EdgeFades from '$lib/components/edge-fades.svelte'
  import {
    IconArrowsInLineVertical,
    IconCaretDown,
    IconPlus,
    IconQuestion,
    IconSearch,
  } from '$lib/icons'
  import { useCurrentUser } from '$lib/query/user'
  import Accordion from '$lib/ui/accordion.svelte'
  import EmptyState from '$lib/ui/empty-state.svelte'
  import Tooltip from '$lib/ui/tooltip.svelte'
  import {
    getCategoryConfig,
    getCategoryKeyOrAlias,
  } from '$lib/utils/categories'
  import { hasPermissions } from '$lib/utils/permissions'
  import AdminChallengesListItem from './list-item.svelte'
  import {
    accordionValue,
    filterChallenges,
    groupChallenges,
  } from './list-logic'

  interface Props {
    challenges: AdminChallenge[]
    selectedId: string | null
    selectedIds: Set<string>
    isCreatingNew: boolean
    onSelect: (challenge: AdminChallenge) => void
    onToggleSelect: (challenge: AdminChallenge) => void
    onSelectAll: (ids: string[]) => void
    onToggleCollapseAll: (collapsing: boolean) => void
    onCreateNew: () => void
    onBulkHide: () => void
    onBulkShow: () => void
    onBulkDelete: () => void
    onClearSelection: () => void
  }

  let {
    challenges,
    selectedId,
    selectedIds,
    isCreatingNew,
    onSelect,
    onToggleSelect,
    onSelectAll,
    onToggleCollapseAll,
    onCreateNew,
    onBulkHide,
    onBulkShow,
    onBulkDelete,
    onClearSelection,
  }: Props = $props()

  const userQuery = useCurrentUser()
  const canWrite = $derived(
    hasPermissions(userQuery.data, Permissions.challsWrite)
  )

  let searchQuery = $state('')
  let collapsed = $state<string[]>([])

  const searching = $derived(searchQuery.trim().length > 0)

  const filtered = $derived(filterChallenges(challenges, searchQuery))
  const groups = $derived(groupChallenges(filtered))
  const selectedCount = $derived(selectedIds.size)
  const bulkDisabled = $derived(selectedCount === 0)
  const groupByCategory = $derived(
    new Map(groups.map(group => [group.category, group]))
  )
  const categories = $derived(groups.map(group => group.category))
  const orderedChallenges = $derived(
    categories.flatMap(category => groupByCategory.get(category)?.challenges ?? [])
  )

  const value = $derived(accordionValue(groups, collapsed, searching))
  const anyOpen = $derived(value.length > 0)

  const stats = $derived({
    challenges: challenges.length,
    categories: new Set(challenges.map(c => getCategoryKeyOrAlias(c.category)))
      .size,
  })

  const emptySubtitle = $derived(
    searching
      ? 'Try a different search term'
      : 'Create your first challenge to get started'
  )

  function handleValueChange(open: string[]) {
    if (searching) return
    collapsed = categories.filter(category => !open.includes(category))
  }

  function toggleCollapseAll() {
    const collapsing = anyOpen
    collapsed = collapsing ? [...categories] : []
    onToggleCollapseAll(collapsing)
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
    const nextButton = document
      .getElementById(`admin-chall-${nextChallenge.id}`)
      ?.querySelector<HTMLButtonElement>('.challenge-select')
    nextButton?.focus()
  }

  function handleListKeydown(event: KeyboardEvent) {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return

    const target = event.target instanceof Element ? event.target : null
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return

    const key = event.key.toLowerCase()
    if (key !== 'w' && key !== 's') return

    event.preventDefault()
    moveSelectedChallenge(key === 'w' ? -1 : 1)
  }
</script>

<admin-challenges-list>
  <list-header>
    <bulk-toolbar>
      <span>{selectedCount.toLocaleString()} selected</span>
      <bulk-actions>
        <button
          type="button"
          class="bulk-action"
          onclick={() => onSelectAll(filtered.map(challenge => challenge.id))}
        >
          All
        </button>
        <button
          type="button"
          class="bulk-action"
          disabled={bulkDisabled}
          onclick={onBulkHide}
        >
          Hide
        </button>
        <button
          type="button"
          class="bulk-action"
          disabled={bulkDisabled}
          onclick={onBulkShow}
        >
          Show
        </button>
        <button
          type="button"
          class="bulk-action danger"
          disabled={bulkDisabled}
          onclick={onBulkDelete}
        >
          Delete
        </button>
        <button
          type="button"
          class="bulk-action subtle"
          disabled={bulkDisabled}
          onclick={onClearSelection}
        >
          Clear
        </button>
      </bulk-actions>
    </bulk-toolbar>

    <list-stats>
      <span data-part="stat">
        <strong>{stats.challenges.toLocaleString()}</strong>
        challenge{stats.challenges === 1 ? '' : 's'}
      </span>
      <span data-part="stat">
        <strong>{stats.categories.toLocaleString()}</strong>
        categor{stats.categories === 1 ? 'y' : 'ies'}
      </span>
    </list-stats>

    <list-controls>
      <search-box>
        <IconSearch />
        <input
          type="search"
          value={searchQuery}
          oninput={event => (searchQuery = event.currentTarget.value)}
          placeholder="Search challenges..."
          aria-label="Search challenges"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
        />
      </search-box>

      <toggle-group data-can-write={canWrite || undefined}>
        <Tooltip label={anyOpen ? 'Collapse all' : 'Expand all'}>
          {#snippet children({ props })}
            <button
              {...mergeProps(props, { onclick: toggleCollapseAll })}
              type="button"
              data-slot="collapse"
              data-active={!anyOpen || undefined}
              aria-label={anyOpen
                ? 'Collapse all categories'
                : 'Expand all categories'}
            >
              <IconArrowsInLineVertical />
            </button>
          {/snippet}
        </Tooltip>

        {#if canWrite}
          <Tooltip label="New challenge">
            {#snippet children({ props })}
              <button
                {...mergeProps(props, { onclick: onCreateNew })}
                type="button"
                data-slot="new"
                data-active={isCreatingNew || undefined}
                aria-label="New challenge"
              >
                <IconPlus />
              </button>
            {/snippet}
          </Tooltip>
        {/if}
      </toggle-group>
    </list-controls>
  </list-header>

  <list-viewport data-fade-scope>
    <list-scroll
      data-fade-source
      role="listbox"
      aria-label="Challenge management list"
      tabindex="-1"
      onkeydown={handleListKeydown}
    >
      {#if groups.length === 0}
        <EmptyState
          icon={IconQuestion}
          title={searching ? 'No challenges found' : 'No challenges yet'}
          subtitle={emptySubtitle}
        />
      {:else}
        <Accordion items={categories} {value} onValueChange={handleValueChange}>
          {#snippet header({ value: category, props, expanded })}
            {@const config = getCategoryConfig(category)}
            {@const entries = groupByCategory.get(category)?.challenges ?? []}
            <group-header data-category-color={config.color}>
              <button {...props} data-expanded={expanded || undefined}>
                <config.icon data-slot="icon" />
                <span data-slot="name">{config.name}</span>
                <span data-slot="count">{entries.length}</span>
                <IconCaretDown data-slot="chevron" />
              </button>
            </group-header>
          {/snippet}

          {#snippet content({ value: category, props })}
            {@const config = getCategoryConfig(category)}
            {@const entries = groupByCategory.get(category)?.challenges ?? []}
            <group-body data-category-color={config.color} {...props}>
              <ul>
                {#each entries as challenge (challenge.id)}
                  <AdminChallengesListItem
                    {challenge}
                    {category}
                    selected={selectedId === challenge.id}
                    multiSelected={selectedIds.has(challenge.id)}
                    onSelect={() => onSelect(challenge)}
                    onToggleSelect={() => onToggleSelect(challenge)}
                  />
                {/each}
              </ul>
            </group-body>
          {/snippet}
        </Accordion>
      {/if}
    </list-scroll>
    <EdgeFades />
  </list-viewport>
</admin-challenges-list>

<style>
  admin-challenges-list {
    container-type: inline-size;
    container-name: admin-challenges-list;
    display: flex;
    flex: 1;
    flex-direction: column;
    min-block-size: 0;
    min-inline-size: 0;
    max-inline-size: 100%;
  }

  list-header {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    gap: 0.5rem;
    padding-block: 0.5rem;
    border-block-end: 1.5px solid rgb(6, 132, 6);
  }

  list-stats {
    display: flex;
    justify-content: space-between;
    padding-inline: 2.25rem;
    color: rgb(1, 19, 49);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    font-family: Open Sans, Verdana, sans-serif;
    font-size: 0.9rem;

    strong {
      color: var(--foreground-l3);
      font-weight: var(--font-weight-normal);
    }
  }

  bulk-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin: 0 1.25rem 0.25rem;
    padding: 0.5rem 0.625rem;
    border: 2px solid rgb(132, 168, 25);
    border-radius: 0.875rem;
    background: color-mix(in srgb, rgba(8, 33, 114, 0.711) 65%, transparent);

    span {
      color: var(--foreground-l1);
      font-size: var(--step-0);
      font-weight: var(--font-weight-medium);
    }
  }

  bulk-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .bulk-action {
    flex: initial;
    min-inline-size: 4.75rem;
    block-size: 2.125rem;
    padding-inline: 0.9rem;
    border-radius: 0.75rem;
    background: transparent;
    border: 1px solid color-mix(in srgb, rgb(167, 230, 235) 35%, transparent);
    color: rgb(185, 81, 213);
    cursor: pointer;
    font-family: Space Grotesk;
    font-size: 0.9rem;

    &:hover:not(:disabled) {
      background: color-mix(in srgb, var(--background-l5) 80%, transparent);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    &.danger {
      border-color: color-mix(in srgb, #ff6d6d 32%, transparent);
      color: #ffb5b5;
    }

    &.subtle {
      background: transparent;
    }
  }

  list-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding-inline: 1.25rem;
    font-family: Verdana;
  }

  search-box {
    display: flex;
    flex: 1;
    align-items: center;
    gap: var(--space-2xs);
    min-inline-size: 0;
    block-size: 2.5rem;
    padding-inline: 0.75rem;
    color: rgb(2, 3, 20);
    background: linear-gradient(
      135deg,
      color-mix(in oklab, rgba(51, 53, 53, 0.695) 50%, transparent),
      color-mix(in oklab, rgb(14, 14, 176) 38%, transparent)
    );
    border-radius: 20px;
    border: 2px solid rgb(46, 152, 101);

    @container admin-challenges-list (min-inline-size: 24rem) {
      border-radius: 20px var(--radius-sm) var(--radius-sm) 20px;
    }

    &:focus-within {
      outline: 2px solid var(--ring);
    }

    :global(svg) {
      flex-shrink: 0;
      color: rgba(249, 123, 161, 0.793);
    }
  }

  input {
    inline-size: 100%;
    min-inline-size: 0;
    background: transparent;
    border: none;
    color: rgb(208, 237, 244);
    outline: none;

    &::placeholder {
      color: blur(0.5, 0.5, 0.5, 0.5);
    }
  }

  toggle-group {
    display: flex;
    gap: 0.25rem;
    inline-size: 100%;

    @container admin-challenges-list (min-inline-size: 24rem) {
      inline-size: auto;
    }
  }

  button {
    display: inline-flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    block-size: 2.5rem;
    padding-inline: 1rem;
    color: rgba(162, 184, 182, 0.697);
    background: color-mix(in srgb, rgba(24, 32, 147, 0.722) 55%, transparent);
    cursor: pointer;

    @container admin-challenges-list (min-inline-size: 24rem) {
      flex: initial;
    }

    &:hover {
      background: var(--background-l5);
    }

    &[data-active] {
      color: var(--foreground-accent);
      background: var(--background-accent);

      &:hover {
        background: var(--background-accent-hover);
      }
    }

    &:focus-visible {
      outline: 2px solid var(--ring);
    }

    :global(svg) {
      font-size: 1.25rem;
    }
  }

  [data-slot='collapse'] {
    border-radius: 20px;
  }

  toggle-group[data-can-write] [data-slot='collapse'] {
    border-radius: 20px var(--radius-sm) var(--radius-sm) 20px;
  }

  [data-slot='new'] {
    border-radius: var(--radius-sm) 20px 20px var(--radius-sm);
  }

  @container admin-challenges-list (min-inline-size: 24rem) {
    [data-slot='collapse'] {
      border-radius: var(--radius-sm) 20px 20px var(--radius-sm);
    }

    toggle-group[data-can-write] [data-slot='collapse'] {
      border-radius: var(--radius-sm);
    }

    [data-slot='new'] {
      border-radius: var(--radius-sm) 20px 20px var(--radius-sm);
    }
  }

  list-viewport {
    --fade-color: var(--background-l1);

    position: relative;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    block-size: 100%;
    min-block-size: 0;
    min-inline-size: 0;
    max-inline-size: 100%;
  }

  list-scroll {
    flex: 1 1 auto;
    block-size: 100%;
    min-block-size: 0;
    min-inline-size: 0;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: none;
    padding-block-end: 4rem;
  }

  group-header {
    position: sticky;
    inset-block-start: 0;
    z-index: 2;
    display: block;
    background: transparent;

    button {
      display: flex;
      flex: initial;
      align-items: center;
      gap: 0.625rem;
      inline-size: 100%;
      block-size: auto;
      padding: 0.5rem 0.5rem 0.5rem 0.625rem;
      text-align: start;
      color: var(--category-foreground-l1);
      background: var(--category-background-l0);

      &:hover {
        background: var(--category-background-l0);
      }

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
    }

    [data-slot='count'] {
      margin-inline-start: auto;
      color: var(--category-foreground-l0);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    :global([data-slot='chevron']) {
      flex-shrink: 0;
      font-size: 1rem;
      color: var(--category-foreground-l1);
      rotate: -90deg;
      transition: rotate 150ms ease;
    }
  }

  group-body {
    display: block;
    min-inline-size: 0;
    max-inline-size: 100%;
    background: var(--category-background-l1);

    ul {
      display: flex;
      flex-direction: column;
      margin: 0;
      padding: 0;
      list-style: none;
      min-inline-size: 0;
    }
  }
</style>
