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
    background: rgba(11, 19, 38, 0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: var(--radius-lg);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
    padding: var(--space-m) var(--space-s);
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease,
      border-color 0.3s ease;

    --color-surface: transparent;
    --color-surface-raised: rgba(15, 23, 42, 0.6);
    --color-bg: transparent;
    --color-card-bg: transparent;
    --color-text: #e2e8f0;
    --color-text-muted: #94a3b8;
    --color-primary: #38bdf8;
    --color-primary-bg: rgba(56, 189, 248, 0.12);
    --color-accent: #38bdf8;
    --color-border: rgba(56, 189, 248, 0.25);
  }

  .glass-widget:hover {
    transform: translateY(-4px);
    border-color: rgba(56, 189, 248, 0.5);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.15);
  }

  .glass-widget :global(ui-status-card),
  .glass-widget :global(ui-status-card *) {
    background: transparent !important;
    border-color: rgba(56, 189, 248, 0.25) !important;
  }

  .glass-widget :global(ui-status-card) {
    position: relative;
    z-index: 2;
    color: #e2e8f0 !important;
  }

  .glass-widget :global(ui-status-card h1),
  .glass-widget :global(ui-status-card h2),
  .glass-widget :global(ui-status-card [data-slot='title']) {
    color: #ffffff !important;
  }

  .glass-widget :global(ui-status-card p),
  .glass-widget :global(ui-status-card [data-slot='subtitle']),
  .glass-widget :global(ui-status-card [data-slot='detail']) {
    color: #94a3b8 !important;
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
    color: #ffffff !important;
    background: linear-gradient(180deg, #0284c7, #0369a1) !important;
    border: 1px solid rgba(56, 189, 248, 0.35) !important;
    box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
    border-radius: var(--radius-md);
    cursor: pointer;
    margin-block-start: var(--space-s);
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(180deg, #0369a1, #075985) !important;
      box-shadow: 0 4px 18px rgba(2, 132, 199, 0.5);
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