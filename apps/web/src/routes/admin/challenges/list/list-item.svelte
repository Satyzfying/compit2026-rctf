<script lang="ts">
  import { ChallengeScoringKind, type AdminChallenge } from '@rctf/types'
  import {
    IconCloud,
    IconEyeClosed,
    IconGlobeHemisphereWest,
    IconRobot,
  } from '$lib/icons'
  import { pointsLabel } from './list-logic'

  interface Props {
    challenge: AdminChallenge
    category: string
    selected: boolean
    multiSelected: boolean
    onSelect: () => void
    onToggleSelect: () => void
  }

  let {
    challenge,
    category,
    selected,
    multiSelected,
    onSelect,
    onToggleSelect,
  }: Props = $props()

  const isDynamic = $derived(
    challenge.scoring?.kind === ChallengeScoringKind.DYNAMIC
  )
  const hasStatusIcon = $derived(
    challenge.hidden ||
      !!challenge.instancerConfig ||
      !!challenge.adminBotConfig ||
      isDynamic
  )
  const points = $derived(pointsLabel(challenge))
</script>

<li>
  <challenge-row>
    <button
      type="button"
      class="select-toggle"
      aria-label={multiSelected ? 'Unselect challenge' : 'Select challenge'}
      data-selected={multiSelected ? '' : undefined}
      onclick={(event: MouseEvent) => {
        event.stopPropagation()
        onToggleSelect()
      }}
    >
      {multiSelected ? '✓' : ''}
    </button>

    <button
      type="button"
      class="challenge-select"
      id={`admin-chall-${challenge.id}`}
      onclick={onSelect}
      data-selected={selected ? '' : undefined}
    >
      <item-title>
        <span data-part="category">{category} /</span>
        <span data-part="name">{challenge.name}</span>
      </item-title>

    <item-meta>
      {#if hasStatusIcon}
        <item-status>
          {#if challenge.hidden}
            <IconEyeClosed data-status-icon />
          {/if}
          {#if isDynamic}
            <IconGlobeHemisphereWest data-status-icon />
          {/if}
          {#if challenge.instancerConfig}
            <IconCloud data-status-icon />
          {/if}
          {#if challenge.adminBotConfig}
            <IconRobot data-status-icon />
          {/if}
        </item-status>
      {/if}
        {#if isDynamic}
          <span data-part="points"><strong>Dynamic</strong></span>
        {:else}
          <span data-part="points"><strong>{points}</strong> pts</span>
        {/if}
      </item-meta>
    </button>
  </challenge-row>
</li>

<style>
  li {
    display: block;
    animation: admin-challenge-entry 360ms ease-out both;
  }

  @keyframes admin-challenge-entry {
    from {
      opacity: 0;
      translate: -1.5rem 0;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    li {
      animation: none;
    }
  }

  challenge-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .select-toggle {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    inline-size: 1.5rem;
    block-size: 1.5rem;
    border: 2px solid color-mix(in srgb, rgb(68, 176, 104) 85%, transparent);
    border-radius: 0.5rem;
    background: rgb(17, 5, 47);
    color: var(--foreground-l0);
    cursor: pointer;
    font-weight: 700;

    &[data-selected] {
      background: blur(0.5, 0.5, 0.5, 0.5);
      border-color: rgb(68, 176, 104);
      color: var(--foreground-accent);
    }
  }

  .challenge-select {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 0.25rem;
    inline-size: 100%;
    max-inline-size: 100%;
    min-inline-size: 0;
    padding: 0.5rem 2.25rem;
    text-align: start;
    cursor: pointer;
    background: var(--category-background-l1);

    &:hover {
      background: var(--category-background-l1-hover);
    }

    &:focus-visible {
      outline: 2px solid var(--ring);
      outline-offset: -2px;
      z-index: 1;
    }

    &[data-selected] {
      box-shadow: inset 0 0 0 2px
        color-mix(in srgb, var(--category-foreground-l1) 25%, transparent);

      &::after {
        content: '';
        position: absolute;
        inset-block: 0;
        inset-inline-end: 0;
        inline-size: 24rem;
        pointer-events: none;
        background: linear-gradient(
          to left,
          var(--category-background-l0),
          transparent
        );
      }
    }
  }

  item-title {
    position: relative;
    z-index: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--step-0);
  }

  [data-part='category'] {
    display: inline;
    color: var(--category-foreground-l1);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  [data-part='name'] {
    color: var(--category-foreground-l0);
  }

  item-meta {
    position: relative;
    z-index: 1;
    display: flex;
    gap: var(--space-s);
    align-items: center;
    justify-content: flex-end;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  item-status {
    display: flex;
    flex-shrink: 0;
    gap: 0.375rem;
    align-items: center;
    color: var(--category-foreground-l1);

    :global(svg[data-status-icon]) {
      flex-shrink: 0;
      font-size: 1rem;
    }
  }

  [data-part='points'] {
    color: var(--category-foreground-l1);

    strong {
      color: var(--category-foreground-l0);
      font-weight: var(--font-weight-normal);
    }
  }

  @container admin-challenges-list (min-inline-size: 24rem) {
    .challenge-select {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-m);
    }

    item-title {
      min-inline-size: 0;
    }
  }
</style>
