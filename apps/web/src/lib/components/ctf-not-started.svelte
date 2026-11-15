<script lang="ts">
  import { useQueryClient } from '@tanstack/svelte-query'
  import { fly } from 'svelte/transition'
  import { isAuthenticated } from '$lib/api'
  import { useClientConfig } from '$lib/query/config'
  import { queryKeys } from '$lib/query/keys'
  import Button from '$lib/ui/button.svelte'

  const queryClient = useQueryClient()
  const configQuery = useClientConfig()
  const startTime = $derived(configQuery.data?.startTime ?? 0)

  let now = $state(Date.now())
  let invalidated = false

  const segments = $derived.by(() => {
    if (startTime <= 0) return []
    const totalSeconds = Math.floor(Math.max(0, startTime - now) / 1000)
    return [
      { label: 'days', value: Math.floor(totalSeconds / 86400) },
      { label: 'hrs', value: Math.floor((totalSeconds % 86400) / 3600) },
      { label: 'min', value: Math.floor((totalSeconds % 3600) / 60) },
      { label: 'sec', value: totalSeconds % 60 },
    ]
  })

  function pad(n: number) {
    return n.toString().padStart(2, '0')
  }

  $effect(() => {
    if (startTime <= 0) return
    const interval = setInterval(() => {
      now = Date.now()
      if (!invalidated && now >= startTime) {
        invalidated = true
        queryClient.invalidateQueries({ queryKey: queryKeys.fullLeaderboard })
        queryClient.invalidateQueries({ queryKey: queryKeys.challenges })
        queryClient.invalidateQueries({ queryKey: queryKeys.clientConfig })
      }
    }, 1000)
    return () => clearInterval(interval)
  })
</script>

<ctf-not-started class="ambient-float">
  <div class="glass-widget" in:fly={{ y: 30, duration: 800, delay: 200 }}>
    <div class="bubble bubble-1"></div>
    <div class="bubble bubble-2"></div>
    <div class="bubble bubble-3"></div>

    <div class="widget-body">
      <h3 class="widget-title">CTF not started</h3>
      <p class="widget-description">
        The competition has not started yet. Check back soon!
      </p>

      {#if segments.length > 0}
        <span class="starts-label">
          <span class="status-dot"></span>
          Starts in
        </span>

        <countdown-display>
          {#each segments as seg, i}
            <countdown-segment>
              <segment-value>{pad(seg.value)}</segment-value>
              <segment-label>{seg.label}</segment-label>
            </countdown-segment>
            {#if i < segments.length - 1}
              <segment-separator>:</segment-separator>
            {/if}
          {/each}
        </countdown-display>
      {/if}

      {#if !isAuthenticated()}
        <div class="divider"></div>
        <Button href="/login">Login</Button>
      {/if}
    </div>
  </div>
</ctf-not-started>

<style>
  ctf-not-started {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: var(--space-s);
  }

  .glass-widget {
    position: relative;
    overflow: hidden;
    display: flex;
    inline-size: 100%;
    max-inline-size: 26rem;
    background: rgba(8, 21, 38, 0.45);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid #0bad5c;
    border-radius: 16px;
    padding: 1.75rem 2rem;
    transition:
      transform 0.3s ease,
      border-color 0.3s ease;
  }

  .glass-widget:hover {
    transform: translateY(-4px);
    border-color: #6fe0ff;
  }

  .widget-body {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.65rem;
    inline-size: 100%;
    text-align: center;
  }

  .widget-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #eafffa;
  }

  .widget-description {
    margin: 0;
    font-size: 0.9rem;
    color: var(--foreground-l3);
  }

  .starts-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-block-start: 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6fe0ff;
  }

  .status-dot {
    display: block;
    inline-size: 0.4rem;
    block-size: 0.4rem;
    border-radius: 50%;
    background: #0bad5c;
    animation: pulse 2.4s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.4;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.3);
    }
  }

  countdown-display {
    display: flex;
    align-items: start;
    justify-content: center;
    gap: var(--space-2xs);
  }

  countdown-segment {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3xs);
    min-inline-size: 2.5rem;
  }

  segment-value {
    display: block;
    font-family: monospace;
    font-size: var(--step-2);
    color: #eafffa;
    font-variant-numeric: tabular-nums;
  }

  segment-label {
    display: block;
    font-size: 0.75rem;
    color: #6fe0ff;
    opacity: 0.75;
  }

  segment-separator {
    display: block;
    font-family: monospace;
    font-size: var(--step-2);
    color: #0bad5c;
    align-self: flex-start;
  }

  .divider {
    inline-size: 100%;
    block-size: 1px;
    background: #0bad5c;
    opacity: 0.3;
    margin-block: var(--space-s);
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
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-8px);
    }
    100% {
      transform: translateY(0px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .status-dot {
      animation: none;
    }
    .ambient-float {
      animation: none;
    }
  }
</style>