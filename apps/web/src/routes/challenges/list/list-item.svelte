<script lang="ts">
  import { ChallengeScoringKind, type Challenge } from '@rctf/types'
  import { IconAwardFilled, IconCheck } from '$lib/icons'
  import ChallengePointDelta from '../model/point-delta.svelte'

  type BloodTier = 'gold' | 'silver' | 'bronze'

  interface Props {
    challenge: Challenge
    category: string
    solved: boolean
    bloodTier: BloodTier | null
    selected: boolean
    canManageChallenges: boolean
    idPrefix?: string
    onSelect: () => void
    onHideChallenge?: (challenge: Challenge) => void
    onDeleteChallenge?: (challenge: Challenge) => void
  }

  let {
    challenge,
    category,
    solved,
    bloodTier,
    selected,
    canManageChallenges,
    idPrefix = '',
    onSelect,
    onHideChallenge,
    onDeleteChallenge,
  }: Props = $props()

  const isDynamic = $derived(
    challenge.scoringKind === ChallengeScoringKind.DYNAMIC
  )
  const showsScore = $derived(challenge.hasFlag || isDynamic)
  const displayPoints = $derived(
    isDynamic ? (challenge.yourScore ?? 0) : challenge.points
  )
  const solvesLabel = $derived(
    `${challenge.solves.toLocaleString()} ${challenge.solves === 1 ? 'solve' : 'solves'}`
  )
</script>

<li id="{idPrefix}chall-{challenge.id}" data-wheel-item>
  <challenge-row>
    <button
      type="button"
      class="challenge-select"
      onclick={onSelect}
      data-solved={solved && !bloodTier ? '' : undefined}
      data-blood={bloodTier ?? undefined}
      data-selected={selected ? '' : undefined}
    >
      {#if bloodTier}
        <IconAwardFilled data-indicator />
      {:else if solved}
        <IconCheck data-indicator />
      {/if}

      <item-main>
        <item-title>
          <span data-part="category">{category} /</span>
          <span data-part="name">{challenge.name}</span>
        </item-title>
        <span data-part="author">{challenge.author}</span>
      </item-main>

      {#if showsScore}
        <item-score>
          <span data-part="points">
            {#if isDynamic && displayPoints === 0}
              <strong>Dynamic</strong>
              <span data-part="unscored">(0 pts)</span>
            {:else}
              <strong>{displayPoints.toLocaleString()}</strong> pts
            {/if}
          </span>
          {#if isDynamic}
            <ChallengePointDelta delta={challenge.yourPointDelta ?? 0} />
          {:else}
            <span data-part="solves">{solvesLabel}</span>
          {/if}
        </item-score>
      {/if}
    </button>

    {#if canManageChallenges && selected}
      <admin-actions>
        <button
          type="button"
          class="admin-action"
          data-action="hide"
          onclick={event => {
            event.stopPropagation()
            onHideChallenge?.(challenge)
          }}
        >
          Hide
        </button>
        <button
          type="button"
          class="admin-action danger"
          data-action="delete"
          onclick={event => {
            event.stopPropagation()
            onDeleteChallenge?.(challenge)
          }}
        >
          Delete
        </button>
      </admin-actions>
    {/if}
  </challenge-row>
</li>

<style>
  li {
    display: block;
    inline-size: calc(100% - 1rem);
    padding-inline: 0.35rem;
    perspective: 900px;
    animation: challenge-entry 420ms ease-out both;
  }

  @keyframes challenge-entry {
    from {
      opacity: 0;
      translate: -2rem 0;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  @keyframes challenge-entry-from-right {
    from {
      opacity: 0;
      translate: 2rem 0;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  :global(list-scroll[data-scroll-direction='down']) :global(li) {
    animation: challenge-entry 420ms ease-out both;
  }

  :global(list-scroll[data-scroll-direction='up']) :global(li) {
    animation: challenge-entry-from-right 420ms ease-out both;
  }

  @media (prefers-reduced-motion: reduce) {
    li,
    :global(list-scroll[data-scroll-direction='down']) :global(li),
    :global(list-scroll[data-scroll-direction='up']) :global(li) {
      animation: none;
    }
  }

  challenge-row {
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
    position: relative;
    z-index: 0;
    transform-style: preserve-3d;
    transform-origin: center;
    transform: translateX(var(--wheel-x, 0px))
      rotateY(var(--wheel-rotate, 0deg)) scale(var(--wheel-scale, 1));
    opacity: var(--wheel-opacity, 1);
    transition: transform 90ms linear, opacity 90ms linear;
  }

  @keyframes challenge-select-pop {
    0% {
      transform: translateX(0) scale(0.98);
      box-shadow: none;
    }
    45% {
      transform: translateX(2px) scale(1.01);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
    }
    100% {
      transform: translateX(0) scale(1);
      box-shadow: none;
    }
  }

  .challenge-select {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.375rem;
    inline-size: 100%;
    padding: 1rem 1.1rem 1rem 1.35rem;
    text-align: start;
    cursor: pointer;
    background: rgba(10, 22, 42, 0.82);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(56, 189, 248, 0.16);
    border-inline-start: 3px solid var(--category-foreground-l1);
    border-radius: 8px;
    transform-origin: center;
    transition:
      transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
      background 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease;

    &:hover {
      background: rgba(16, 34, 64, 0.94);
      border-color: rgba(56, 189, 248, 0.45);
      box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.45), 0 0 12px rgba(56, 189, 248, 0.14);
      transform: translateX(4px);
    }

    &:active {
      transform: translateX(2px) scale(0.995);
    }

    &[data-selected] {
      z-index: 3;
      animation: challenge-select-pop 260ms cubic-bezier(0.22, 1, 0.36, 1);
      transform: translateX(0.75rem) translateZ(2rem) scale(1.025);
      box-shadow:
        0 0.75rem 1.5rem rgb(0 0 0 / 22%),
        inset 0 0 0 2px
          color-mix(in srgb, var(--category-foreground-l1) 34%, transparent);

      &:hover {
        transform: translateX(0.9rem) translateZ(2rem) scale(1.03);
      }
    }

    &:focus-visible {
      outline: 2px solid var(--ring);
      outline-offset: -2px;
      z-index: 1;
    }

    &[data-solved] {
      --edge-color: var(--foreground-success);
    }

    &[data-blood='gold'] {
      --edge-color: var(--foreground-gold-l0);
      --edge-soft: var(--background-gold);
    }

    &[data-blood='silver'] {
      --edge-color: var(--foreground-silver-l0);
      --edge-soft: var(--background-silver);
    }

    &[data-blood='bronze'] {
      --edge-color: var(--foreground-bronze-l0);
      --edge-soft: var(--background-bronze);
    }

    &[data-solved]::before,
    &[data-blood]::before {
      content: '';
      position: absolute;
      inset-block: 0.2rem;
      inset-inline-start: 0.2rem;
      inline-size: 5rem;
      pointer-events: none;
      border-radius: 999px;
      background: linear-gradient(to right, var(--edge-soft), transparent);
    }

    &[data-selected] {
      box-shadow:
        inset 0 0 0 2px
          color-mix(in srgb, var(--category-foreground-l1) 24%, transparent),
        0 0 0 1px color-mix(in srgb, var(--category-foreground-l1) 12%, transparent);

      &::after {
        content: '';
        position: absolute;
        inset-block: 0;
        inset-inline-end: 0;
        inline-size: 10rem;
        pointer-events: none;
        background: linear-gradient(
          to left,
          color-mix(in oklab, var(--category-background-l0) 85%, transparent),
          transparent
        );
      }
    }

    :global(svg[data-indicator]) {
      position: absolute;
      inset-block-start: 0.75rem;
      inset-inline-start: 0.7rem;
      font-size: 1rem;
      color: var(--edge-color);
      z-index: 1;
    }
  }

  :global(challenges-list[data-has-selection='true'])
    .challenge-select:not([data-selected]) {
    opacity: 0.68;
    transform: translateZ(-1rem) scale(0.975);
  }

  item-main {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
  }

  item-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 1.125rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
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

  [data-part='author'] {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--category-foreground-l1);
    opacity: 0.75;
  }

  item-score {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    align-items: baseline;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  admin-actions {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    justify-content: center;
    margin-inline-start: auto;
    align-items: stretch;
  }

  .admin-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    block-size: 1.7rem;
    padding-inline: 0.6rem;
    color: var(--foreground-l1);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 999px;
    font-size: var(--step--2);
    cursor: pointer;
    transition: background 150ms ease, border-color 150ms ease;

    &:hover {
      background: rgba(18, 119, 134, 0.08);
      border-color: rgba(255, 255, 255, 0.14);
    }

    &.danger {
      color: #ffb4b4;
      border-color: rgba(255, 121, 121, 0.28);
    }
  }

  [data-part='points'] {
    font-size: 1.125rem;
    color: var(--category-foreground-l1);

    strong {
      color: var(--category-foreground-l0);
      font-weight: 700;
    }
  }

  [data-part='unscored'] {
    color: var(--category-foreground-l1);
    font-size: var(--step-0);
    opacity: 0.6;
  }

  [data-part='solves'] {
    color: var(--category-foreground-l1);
    opacity: 0.75;
  }

  @container challenges-list (min-inline-size: 24rem) {
    .challenge-select {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding-inline-end: 1.25rem;
    }

    [data-part='category'] {
      display: inline;
    }

    item-score {
      flex-direction: column;
      align-items: flex-end;
      gap: 0;
    }
  }

</style>
