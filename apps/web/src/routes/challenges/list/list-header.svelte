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
    padding-block: 0.75rem 0.9rem;
    background: color-mix(in hsl shorter hue, rgba(2, 2, 57, 0.804) 50%, transparent 10%);
    border-block-end: 2px solid rgb(89 190 214 / 24%);
    font-family: Grape Nuts;
  }

  list-stats {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    align-self: flex-start;
    margin-inline-start: 1.25rem;
    padding: 0.35rem 0.8rem;
    color: #b8e9f3;
    background: rgb(18 59 104 / 78%);
    border: 1px solid rgb(92 193 216 / 30%);
    border-radius: 999px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    font-family: Verdana;

    strong {
      color: #e0fbff;
      font-weight: var(--font-weight-normal);
    }

    .stats-divider {
      color: #78bfce;
      opacity: 0.6;
    }
  }

  list-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding-inline: 1.25rem;
    justify-content: space-between;
    font-family: Verdana;
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
    block-size: 2.5rem;
    padding-inline: 0.75rem;
    color: #b8e9f3;
    background: rgb(35 42 74 / 88%);
    border: 1px solid rgba(0, 0, 0, 0.24);
    border-radius: 20px;

    @container challenges-list (width >= 24rem) {
      margin-inline-start: 2rem;
    }

    @container challenges-list (width >= 24rem) {
      border-radius: 20px var(--radius-sm) var(--radius-sm) 20px;
    }

    &:focus-within {
      outline: 2px solid var(--ring);
    }

    :global(svg) {
      flex-shrink: 0;
      color: #6fd0df;
    }
  }

  input {
    inline-size: 100%;
    min-inline-size: 0;
    background: transparent;
    border: none;
    color: #e8fbff;
    outline: none;

    &::placeholder {
      color: #8db7c9;
    }
  }

  button {
    display: inline-flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    block-size: 2.5rem;
    padding-inline: 1rem;
    color: #c9f3fa;
    background: rgb(29 45 82 / 88%);
    border: 1px solid rgb(121 176 213 / 20%);
    cursor: pointer;

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
