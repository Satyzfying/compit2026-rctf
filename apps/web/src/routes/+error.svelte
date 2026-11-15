<script lang="ts">
  import { page } from '$app/state'
  import Button from '$lib/ui/button.svelte'
  import StatusCard from '$lib/ui/status-card.svelte'

  const is404 = $derived(page.status === 404)

  const detail = $derived(
    page.error?.message
      ? `${page.error.message} · ${page.status}`
      : `Error ${page.status}`
  )
</script>

<error-page>
  <div class="glass-widget">
    <div class="glow-orb glow-orb-1"></div>
    <div class="glow-orb glow-orb-2"></div>
    <div class="glow-orb glow-orb-3"></div>

    <StatusCard
      title={is404
        ? '404: this flag doesn\'t exist'
        : 'Oops, we tripped over a wire'}
      subtitle={is404
        ? "You went looking for a page that's either hidden really well, or just... isn't there. Either way, nice try."
        : "Something broke on our end, not yours. Our team's already poking at it with a stick."}
      {detail}
    >
      <Button class="back-button" href="/">
        {is404 ? 'Back to safety' : 'Take me home'}
      </Button>
    </StatusCard>
  </div>
</error-page>

<style>
  error-page {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: var(--space-s);
  }

  .glass-widget {
    position: relative;
    overflow: hidden;
    inline-size: 100%;
    max-inline-size: 26rem;
    background: rgba(8, 21, 38, 0.45);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid #0bad5c;
    border-radius: 16px;
    padding: var(--space-m) var(--space-s);
    transition:
      transform 0.3s ease,
      border-color 0.3s ease;

    --color-surface: transparent;
    --color-surface-raised: rgba(8, 21, 38, 0.4);
    --color-bg: transparent;
    --color-card-bg: transparent;
    --color-text: #6fe0ff;
    --color-text-muted: #9fd8ff;
    --color-primary: #0bad5c;
    --color-primary-bg: rgba(11, 173, 92, 0.12);
    --color-accent: #0effc7;
    --color-border: #0bad5c;
  }

  .glass-widget:hover {
    transform: translateY(-4px);
    border-color: #6fe0ff;
  }

  .glass-widget :global(ui-status-card),
  .glass-widget :global(ui-status-card *) {
    background: transparent !important;
    border-color: #0bad5c !important;
  }

  .glass-widget :global(ui-status-card) {
    position: relative;
    z-index: 2;
    color: #6fe0ff !important;
  }

  .glass-widget :global(ui-status-card h1),
  .glass-widget :global(ui-status-card h2),
  .glass-widget :global(ui-status-card [data-slot='title']) {
    color: #eaf9ff !important;
  }

  .glass-widget :global(ui-status-card p),
  .glass-widget :global(ui-status-card [data-slot='subtitle']),
  .glass-widget :global(ui-status-card [data-slot='detail']) {
    color: #9fd8ff !important;
  }

  .glass-widget :global(a) {
    inline-size: 100%;
  }

  
  .glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(1px);
    background: radial-gradient(circle at 35% 35%, rgba(111, 224, 255, 0.18), transparent 70%);
    pointer-events: none;
    z-index: 0;
    animation: orb-float ease-in-out infinite;
  }

  .glow-orb-1 {
    width: 120px;
    height: 120px;
    top: -30px;
    right: -20px;
    animation-duration: 7s;
  }

  .glow-orb-2 {
    width: 70px;
    height: 70px;
    bottom: -10px;
    left: -10px;
    animation-duration: 8.5s;
    animation-delay: 1s;
  }

  .glow-orb-3 {
    width: 45px;
    height: 45px;
    bottom: 30%;
    right: 10%;
    animation-duration: 6s;
    animation-delay: 2.5s;
  }

  @keyframes orb-float {
    0%,
    100% {
      transform: translateY(0);
      opacity: 0.6;
    }
    50% {
      transform: translateY(-12px);
      opacity: 1;
    }
  }

  .back-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    block-size: auto;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6fe0ff !important;
    background: linear-gradient(
      180deg,
      rgba(8, 22, 34, 0.92),
      rgba(6, 20, 32, 0.86)
    ) !important;
    border: 1px solid #0bad5c !important;
    border-radius: var(--radius-lg);
    cursor: pointer;
    margin-block-start: var(--space-s);
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      transform 0.2s ease;

    &:hover {
      color: #c8fff5 !important;
      border-color: #6fe0ff !important;
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .glow-orb {
      animation: none;
    }
  }
</style>