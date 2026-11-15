<script lang="ts">
  import { mergeProps } from '@zag-js/svelte'
  import {
    IconArrowsInLineVertical,
    IconEye,
    IconEyeClosed,
    IconSearch,
  } from '$lib/icons'
  import Tooltip from '$lib/ui/tooltip.svelte'

  interface Props {
    pointsEarned: number
    pointsTotal: number
    solvedCount: number
    totalCount: number
    searchQuery: string
    hideSolved: boolean
    anyOpen: boolean
    onSearchChange: (value: string) => void
    onToggleHideSolved: () => void
    onToggleCollapse: () => void
  }

  let {
    pointsEarned,
    pointsTotal,
    solvedCount,
    totalCount,
    searchQuery,
    hideSolved,
    anyOpen,
    onSearchChange,
    onToggleHideSolved,
    onToggleCollapse,
  }: Props = $props()
</script>

<challenges-list-header>
  <list-stats>
    <span data-part="points">
      <strong>{pointsEarned.toLocaleString()}</strong>
      / {pointsTotal.toLocaleString()} pts
    </span>
    <span class="stats-divider" aria-hidden="true">|</span>
    <span data-part="solved">
      <strong>{solvedCount.toLocaleString()}</strong>
      / {totalCount.toLocaleString()}
    </span>
  </list-stats>

  <list-controls>
    <search-box>
      <IconSearch />
      <input
        type="search"
        value={searchQuery}
        oninput={event => onSearchChange(event.currentTarget.value)}
        placeholder="Search challenges..."
        aria-label="Search challenges"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
      />
    </search-box>

    <toggle-group>
      <Tooltip label={hideSolved ? 'Show solved' : 'Hide solved'}>
        {#snippet children({ props })}
          <button
            {...mergeProps(props, { onclick: onToggleHideSolved })}
            type="button"
            data-slot="hide-solved"
            data-active={hideSolved || undefined}
            aria-pressed={hideSolved}
            aria-label={hideSolved
              ? 'Show solved challenges'
              : 'Hide solved challenges'}
          >
            {#if hideSolved}
              <IconEyeClosed />
            {:else}
              <IconEye />
            {/if}
          </button>
        {/snippet}
      </Tooltip>

      <Tooltip label={anyOpen ? 'Collapse all' : 'Expand all'}>
        {#snippet children({ props })}
          <button
            {...mergeProps(props, { onclick: onToggleCollapse })}
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
    </toggle-group>
  </list-controls>
</challenges-list-header>

<style>
  challenges-list-header {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    gap: 0.5rem;
    padding-block: 0.65rem 0.75rem;
    background: #131620;
    border-block-end: 1px solid rgba(255, 255, 255, 0.08);
  }

  list-stats {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    align-self: flex-start;
    margin-inline-start: 1.25rem;
    padding: 0.3rem 0.75rem;
    color: #a3a9b8;
    background: #1a1e28;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    font-size: 0.8125rem;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;

    strong {
      color: #ededed;
      font-weight: 500;
    }

    .stats-divider {
      color: rgba(255, 255, 255, 0.12);
    }
  }

  list-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding-inline: 1.25rem;
    justify-content: space-between;
  }

  toggle-group {
    display: flex;
    gap: 0.25rem;
    inline-size: auto;
    flex-shrink: 0;

    @container challenges-list (width >= 24rem) {
      inline-size: auto;
    }
  }

  search-box {
    display: flex;
    flex: 1 1 16rem;
    align-items: center;
    gap: var(--space-2xs);
    min-inline-size: 0;
    max-inline-size: 22rem;
    block-size: 2.125rem;
    padding-inline: 0.75rem;
    color: #f1f5f9;
    background: rgba(10, 22, 42, 0.85);
    border: 1px solid rgba(56, 189, 248, 0.18);
    border-radius: 6px;

    @container challenges-list (width >= 24rem) {
      margin-inline-start: 2rem;
    }

    &:focus-within {
      outline: none;
      border-color: #38bdf8;
      box-shadow: 0 0 0 1px #38bdf8;
    }

    :global(svg) {
      flex-shrink: 0;
      color: #94a3b8;
      font-size: 1rem;
    }
  }

  input {
    inline-size: 100%;
    min-inline-size: 0;
    background: transparent;
    border: none;
    color: #f1f5f9;
    font-size: 0.875rem;
    outline: none;

    &::placeholder {
      color: rgba(148, 163, 184, 0.55);
    }
  }

  button {
    display: inline-flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    block-size: 2.125rem;
    padding-inline: 0.75rem;
    color: #cbd5e1;
    background: rgba(10, 22, 42, 0.85);
    border: 1px solid rgba(56, 189, 248, 0.18);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.12s ease;

    &:hover {
      color: #f1f5f9;
      background: rgba(16, 34, 64, 0.9);
      border-color: rgba(56, 189, 248, 0.35);
    }

    @container challenges-list (width >= 24rem) {
      flex: initial;
    }

    &[data-slot='hide-solved'] {
      border-radius: 20px var(--radius-sm) var(--radius-sm) 20px;

      @container challenges-list (width >= 24rem) {
        border-radius: var(--radius-sm);
      }
    }

    &[data-slot='collapse'] {
      border-radius: var(--radius-sm) 20px 20px var(--radius-sm);
    }

    :global(svg) {
      font-size: 1.25rem;
    }

    &:hover {
      background: color-mix(in hsl shorter hue, rgba(43, 34, 137, 0.844) 25%, transparent);
    }

    &[data-active] {
      color: rgb(131, 220, 255);
      background: color-mix(in hsl shorter hue, rgba(8, 8, 117, 0.848) 25%, transparent 5%);

      &:hover {
        background: color-mix(in hsl shorter hue, rgb(82, 130, 149) 25%, transparent 10%);
      }
    }

    &:focus-visible {
      outline: 2px solid var(--ring);
    }
  }
</style>
