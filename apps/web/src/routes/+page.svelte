<script lang="ts">
  import { onMount } from 'svelte'
  import { useClientConfig } from '$lib/query/config'
  import { intervalToDuration } from '$lib/utils/time'
  import Markdown from '$lib/components/markdown.svelte'
  import Card from '$lib/ui/card.svelte'
  import type { PageProps } from './$types'

  const { data }: PageProps = $props()
  const configQuery = useClientConfig()
  const clientConfig = $derived(configQuery.data ?? data?.clientConfig)

  const startTime = $derived(clientConfig?.startTime ?? 0)
  const endTime = $derived(clientConfig?.endTime ?? 0)
  const ctfName = $derived(clientConfig?.ctfName ?? 'CompIT 2026')

  let now = $state(Date.now())
  const hasStarted = $derived(startTime > 0 && now >= startTime)
  const hasEnded = $derived(endTime > 0 && now >= endTime)

  // Cyber text scramble decoder effect (Matrix/Hacker style)
  let displayTitle = $state('CompIT 2026')
  const scrambleChars = '01#%&*+=-_<>{}[]/\\~^$!?'
  let scrambleTimer: ReturnType<typeof setInterval> | undefined

  function triggerScramble(target = ctfName) {
    if (scrambleTimer) clearInterval(scrambleTimer)
    let iteration = 0
    scrambleTimer = setInterval(() => {
      displayTitle = target
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' '
          return index < Math.floor(iteration)
            ? char
            : scrambleChars[Math.floor(Math.random() * scrambleChars.length)]
        })
        .join('')
      if (iteration >= target.length) {
        clearInterval(scrambleTimer)
        displayTitle = target
      }
      iteration += 0.5
    }, 28)
  }

  $effect(() => {
    if (ctfName && displayTitle === 'CompIT 2026') {
      displayTitle = ctfName
    }
  })

  onMount(() => {
    triggerScramble(ctfName)
    const timer = setInterval(() => (now = Date.now()), 1000)
    return () => {
      clearInterval(timer)
      if (scrambleTimer) clearInterval(scrambleTimer)
    }
  })

  const countdownText = $derived.by(() => {
    if (hasEnded) return 'COMPETITION ENDED'
    if (!startTime) return '--:--:--'
    const target = hasStarted ? endTime : startTime
    const { days, hours, minutes, seconds } = intervalToDuration(
      Math.max(0, target - now)
    )
    const pad = (v: number) => String(v).padStart(2, '0')
    const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    return days > 0 ? `${days}d ${clock}` : clock
  })
</script>

<svelte:head>
  <title>{ctfName}</title>
</svelte:head>

<div class="home-container">
  <!-- Hero Card -->
  <Card>
    <div class="hero-card-container">
      <!-- Subtle ambient floating bubbles (contained within hero card) -->
      <div class="ambient-bubble bubble-1" aria-hidden="true"></div>
      <div class="ambient-bubble bubble-2" aria-hidden="true"></div>
      <div class="ambient-bubble bubble-3" aria-hidden="true"></div>

      <div class="hero-header">
        <div class="hero-badge">
          <span class="pulse-dot"></span>
          <span class="badge-text">
            {#if hasEnded}
              Competition Ended
            {:else if hasStarted}
              CompIT Live Now
            {:else}
              CompIT 2026 CTF
            {/if}
          </span>
        </div>

        <h1
          class="hero-title"
          onmouseenter={() => triggerScramble(ctfName)}
          title="Hover to decode"
        >
          {displayTitle}
        </h1>

        <!-- Live Countdown Status Bar -->
        <div class="countdown-bar">
          <div class="countdown-label">
            {#if hasEnded}
              Status
            {:else if hasStarted}
              Ends in
            {:else}
              Starts in
            {/if}
          </div>
          <div class="countdown-value">{countdownText}</div>
        </div>

        <!-- Quick Action Buttons -->
        <div class="action-buttons">
          <a href="/rules" class="btn btn-secondary">
            Rules &amp; Regulations
          </a>
          <a href="/login" class="btn btn-primary">
            Team Login
          </a>
        </div>
      </div>
    </div>
  </Card>

  <!-- Official Competition Guidelines / Content -->
  {#if clientConfig?.homeContent}
    <Card>
      <div class="prose-wrapper">
        <Markdown content={clientConfig.homeContent} />
      </div>
    </Card>
  {/if}

  <footer class="home-footer">
    <p>CompIT 2026 &bull; Department of Information Technology ITS &bull; Powered by rCTF</p>
  </footer>
</div>

<style>
  .home-container {
    max-width: 54rem;
    margin: 0 auto;
    padding: var(--space-s) var(--space-m) var(--space-2xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }

  .hero-card-container {
    position: relative;
    overflow: hidden;
    border-radius: inherit;
    margin: -0.5rem -1rem;
    padding: 0.5rem 1rem;
  }

  .ambient-bubble {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    background: radial-gradient(circle at 35% 35%, rgba(56, 189, 248, 0.2) 0%, rgba(14, 116, 144, 0.05) 60%, transparent 100%);
    border: 1px solid rgba(56, 189, 248, 0.22);
    box-shadow: inset 0 0 10px rgba(56, 189, 248, 0.15), 0 0 14px rgba(56, 189, 248, 0.08);
    z-index: 0;
  }

  .bubble-1 {
    width: 64px;
    height: 64px;
    bottom: -15px;
    left: 8%;
    animation: float-bubble 11s ease-in-out infinite alternate;
  }

  .bubble-2 {
    width: 88px;
    height: 88px;
    bottom: -25px;
    right: 10%;
    animation: float-bubble 15s ease-in-out infinite alternate;
    animation-delay: -4s;
  }

  .bubble-3 {
    width: 38px;
    height: 38px;
    top: 20%;
    right: 22%;
    animation: float-bubble 9s ease-in-out infinite alternate;
    animation-delay: -6s;
  }

  @keyframes float-bubble {
    0% {
      transform: translate(0, 0) scale(0.92);
      opacity: 0.14;
    }
    50% {
      transform: translate(14px, -28px) scale(1.06);
      opacity: 0.32;
    }
    100% {
      transform: translate(-10px, -50px) scale(1);
      opacity: 0.12;
    }
  }

  .hero-header {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--space-s) 0;
    gap: var(--space-xs);
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.65rem;
    background: rgba(10, 22, 42, 0.85);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #94a3b8;
  }

  .pulse-dot {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 50%;
    background: #38bdf8;
  }

  .hero-title {
    font-size: 2.25rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: #f1f5f9;
    margin: 0.25rem 0 0 0;
    cursor: default;
    user-select: none;
    transition: color 0.2s ease;

    &:hover {
      color: #38bdf8;
    }
  }


  .countdown-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 2rem;
    background: rgba(6, 14, 28, 0.75);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 8px;
    margin: var(--space-2xs) 0;
  }

  .countdown-label {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #94a3b8;
  }

  .countdown-value {
    font-family: var(--font-mono, monospace);
    font-size: 1.5rem;
    font-weight: 600;
    color: #38bdf8;
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
    margin-top: var(--space-2xs);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1.25rem;
    font-size: 0.9375rem;
    font-weight: 500;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.15s ease;
    cursor: pointer;

    &:active {
      transform: scale(0.98);
    }
  }

  .btn-primary {
    color: #ffffff;
    background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%);
    border: 1px solid rgba(56, 189, 248, 0.35);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

    &:hover {
      background: linear-gradient(180deg, #0369a1 0%, #075985 100%);
    }
  }

  .btn-secondary {
    color: #cbd5e1;
    background: rgba(10, 22, 42, 0.82);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(56, 189, 248, 0.2);

    &:hover {
      color: #f1f5f9;
      background: rgba(16, 34, 64, 0.9);
      border-color: rgba(56, 189, 248, 0.4);
    }
  }

  .prose-wrapper {
    padding: var(--space-xs);
    line-height: 1.65;
    color: var(--foreground-l1, #cbd5e1);
  }

  .home-footer {
    text-align: center;
    padding-top: var(--space-xs);
    font-size: 0.8rem;
    color: var(--foreground-l3, #64748b);
  }
</style>
