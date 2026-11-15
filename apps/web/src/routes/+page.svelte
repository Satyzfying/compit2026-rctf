<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { fade, fly } from 'svelte/transition'
  import ThemeToggle from '$lib/components/theme-toggle.svelte'
  import { useClientConfig } from '$lib/query/config'

  let showIntro = $state(true)
  let scrambledDate = $state('00000000000000')
  let now = $state(Date.now())
  let scrambleInterval: ReturnType<typeof setInterval>

  const configQuery = useClientConfig()
  const clientConfig = $derived(configQuery.data)
  const startTime = $derived(clientConfig?.startTime ?? 0)
  const endTime = $derived(clientConfig?.endTime ?? 0)
  const hasStarted = $derived(startTime > 0 && now >= startTime)
  const hasEnded = $derived(endTime > 0 && now >= endTime)
  const startDateLabel = $derived(
    startTime > 0
      ? new Date(startTime).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : '—'
  )
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'

  function startScrambleEffect() {
    const targetText = startDateLabel
    let iteration = 0
    clearInterval(scrambleInterval)
    scrambleInterval = setInterval(() => {
      scrambledDate = targetText
        .split('')
        .map((character, index) =>
          index < iteration
            ? character
            : chars[Math.floor(Math.random() * chars.length)]
        )
        .join('')
      if (iteration >= targetText.length) clearInterval(scrambleInterval)
      iteration += 1 / 3
    }, 50)
  }

  onMount(() => {
    const timer = setInterval(() => (now = Date.now()), 1000)
    const hasSeenIntro = localStorage.getItem('has-seen-intro') === 'true'

    if (hasSeenIntro) {
      showIntro = false
      startScrambleEffect()
    } else {
      setTimeout(() => {
        showIntro = false
        localStorage.setItem('has-seen-intro', 'true')
        setTimeout(startScrambleEffect, 500)
      }, 2000)
    }

    return () => clearInterval(timer)
  })

  onDestroy(() => clearInterval(scrambleInterval))
</script>

{#if showIntro}
  <div class="intro-screen" out:fade={{ duration: 500 }}>
    <h1 in:fly={{ y: 20, duration: 2500 }}>
      Welcome to <span class="accent">{clientConfig?.ctfName ?? 'CompIT 2026'}</span>...
    </h1>
  </div>
{:else}
  <div class="home-content ambient-float" in:fade={{ duration: 500, delay: 500 }}>
    <dashboard-widgets>
      <div class="glass-widget" in:fly={{ y: 30, duration: 800, delay: 200 }}>
        <div class="bubble bubble-1"></div>
        <div class="bubble bubble-2"></div>
        <div class="bubble bubble-3"></div>
        <div class="widget-header">
          <h3>
            {#if hasEnded}
              {clientConfig?.ctfName ?? 'CompIT 2026'} ended:
            {:else if hasStarted}
              {clientConfig?.ctfName ?? 'CompIT 2026'} started:
            {:else}
              {clientConfig?.ctfName ?? 'CompIT 2026'} starts:
            {/if}
          </h3>
        </div>
        <div class="widget-body">
          <div class="stat-box">
            <span class="start-time">
              {hasEnded ? 'ENDED' : hasStarted ? 'LIVE NOW!' : scrambledDate}
            </span>
          </div>
        </div>
      </div>
    </dashboard-widgets>
  </div>
{/if}

<header class="nav-bottom-right">
  <ThemeToggle />
</header>
<style>
  .intro-screen {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    background: linear-gradient(
      135deg,
      rgb(12 48 92 / 72%),
      rgb(16 86 112 / 42%)
    );
  }

  .logo {
    block-size: 25%;
    inline-size: auto;
  }

  .logoHCS {
    display: none;
  }
  :global(:root[data-theme='dark']) .logoHCS {
    display: block;
  }

  .intro-screen h1 {
    font-size: 2rem;
    color: var(--foreground-l2);
    font-family: monospace;
  }

  .accent {
    color: #407fcc;
    font-weight: bold;
  }

  .home-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 75dvh;
    gap: 2rem;
    padding: 2rem;
    max-width: 64rem;
    margin: 0 auto;
  }

  .start-time {
    color: #0a1877;
    font-weight: 600;
    font-family: monospace;
    font-size: 1.75rem; 
    justify-content: center;
    font-family: Almendra;
  }

  dashboard-widgets {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  .glass-widget {
    position: relative;
    overflow: hidden;
    background: color-mix(in srgb, rgba(14, 4, 29, 0.632) 55%, transparent);
    backdrop-filter: blur(12px); 
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid #199777;
    border-radius: 16px;
    padding: 4rem 5rem;
    min-width: 280px;
    /* box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3); */
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  }

  .glass-widget:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4);
    border-color: rgba(47, 76, 203, 0.5); 
  }

  .widget-header {
    display: flex;
    align-items: center;
    justify-content: center; 
    margin-bottom: 1.25rem;
    position: relative;
    z-index: 1;
  }

  .widget-header h3 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 1000;
    color: rgba(135, 255, 195, 0.796);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: elegant;
  }

  .widget-body {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: center;
  }

  .stat-box {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .bubble {
    position: absolute;
    bottom: -20px;
    border-radius: 50%;
    background: rgba(88, 249, 230, 0.15); 
    border: 1px solid rgba(88, 249, 230, 0.4);
    animation: rise infinite ease-in;
    pointer-events: none; 
  }

  .bubble-1 {
    width: 12px;
    height: 12px;
    left: 20%;
    animation-duration: 4s;
    animation-delay: 0s;
  }

  .bubble-2 {
    width: 8px;
    height: 8px;
    left: 60%;
    animation-duration: 3s;
    animation-delay: 1.5s;
  }

  .bubble-3 {
    width: 16px;
    height: 16px;
    left: 80%;
    animation-duration: 5s;
    animation-delay: 3s;
  }

  @keyframes rise {
    0% {
      bottom: -20px;
      transform: translateX(0);
      opacity: 0;
    }
    50% {
      opacity: 1;
      transform: translateX(10px); 
    }
    100% {
      bottom: 120%; 
      transform: translateX(-15px);
      opacity: 0; 
    }
  }
    .ambient-float {
    animation: float 6s ease-in-out infinite;
  }

  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
    100% { transform: translateY(0px); }
  }

    









     .nav-bottom-right {
    inset-block-end: 0;
    inset-inline-end: 2.25rem;
    position: fixed;
    display: none;
    align-items: center;
    gap: var(--space-xs);

    @media (width >= 48rem) {
      display: flex;
    }
  }
</style>