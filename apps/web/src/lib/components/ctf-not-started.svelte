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

<ctf-not-started>
  <div class="card-widget">
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

  .card-widget {
    position: relative;
    overflow: hidden;
    display: flex;
    inline-size: 100%;
    max-inline-size: 26rem;
    background: rgba(10, 22, 42, 0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(56, 189, 248, 0.18);
    border-radius: 12px;
    box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.5);
    padding: 1.5rem 1.75rem;
  }

  .widget-body {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    inline-size: 100%;
    text-align: center;
  }

  .widget-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #f1f5f9;
  }

  .widget-description {
    margin: 0;
    font-size: 0.875rem;
    color: #94a3b8;
  }

  .starts-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-block-start: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #94a3b8;
  }

  .status-dot {
    display: block;
    inline-size: 0.4rem;
    block-size: 0.4rem;
    border-radius: 50%;
    background: #38bdf8;
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
    min-inline-size: 2.25rem;
  }

  segment-value {
    display: block;
    font-family: var(--font-mono, monospace);
    font-size: var(--step-2);
    font-weight: 600;
    color: #38bdf8;
    font-variant-numeric: tabular-nums;
  }

  segment-label {
    display: block;
    font-size: 0.6875rem;
    color: #94a3b8;
    text-transform: uppercase;
  }

  segment-separator {
    display: block;
    font-family: var(--font-mono, monospace);
    font-size: var(--step-2);
    color: rgba(56, 189, 248, 0.4);
    align-self: flex-start;
  }

  .divider {
    inline-size: 100%;
    block-size: 1px;
    background: rgba(56, 189, 248, 0.16);
    margin-block: var(--space-xs);
  }
</style>