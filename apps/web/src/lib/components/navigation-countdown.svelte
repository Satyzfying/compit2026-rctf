<script lang="ts">
  import { useClientConfig } from '$lib/query/config'
  import { intervalToDuration } from '$lib/utils/time'

  const configQuery = useClientConfig()
  const clientConfig = $derived(configQuery.data)

  const startTime = $derived(clientConfig?.startTime ?? 0)
  const endTime = $derived(clientConfig?.endTime ?? 0)

  let now = $state(Date.now())
  const hasStarted = $derived(now >= startTime)
  const hasEnded = $derived(now >= endTime)
  const isFreezeTime = $derived(
    hasStarted && !hasEnded && now >= endTime - 60 * 60 * 1000
  )

  $effect(() => {
    if (hasEnded) return
    const interval = setInterval(() => (now = Date.now()), 1000)
    return () => clearInterval(interval)
  })

  const label = $derived(
    clientConfig?.isArchived
      ? 'Archived'
      : hasEnded
        ? 'CTF over'
        : isFreezeTime
          ? 'Freeze time'
        : hasStarted
          ? 'CTF ends in'
          : 'CTF starts in'
  )

  const text = $derived.by(() => {
    if (hasEnded) return '--:--:--'
    const targetTime = hasStarted ? endTime : startTime
    const { days, hours, minutes, seconds } = intervalToDuration(
      Math.max(0, targetTime - now)
    )
    const pad = (value: number) => String(value).padStart(2, '0')
    const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    return days > 0 ? `${days}d ${clock}` : clock
  })
</script>

{#if clientConfig && (startTime > 0 || endTime > 0)}
  <nav-countdown class:ended={hasEnded}>
    <countdown-label>{label}</countdown-label>
    <span class="divider" aria-hidden="true"></span>
    <countdown-time>{text}</countdown-time>
  </nav-countdown>
{/if}

<style>
  nav-countdown {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    block-size: 2.125rem;
    padding-inline: 0.75rem;
    background: rgba(10, 22, 42, 0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: var(--radius-md);

    @media (width < 64rem) {
      display: none;
    }
  }

  countdown-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #94a3b8;
    white-space: nowrap;
  }

  .divider {
    display: block;
    inline-size: 1px;
    block-size: 1rem;
    background: rgba(56, 189, 248, 0.2);
    flex-shrink: 0;
  }

  countdown-time {
    display: block;
    font-family: var(--font-mono, monospace);
    font-size: 0.875rem;
    font-weight: 600;
    color: #38bdf8;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  nav-countdown.ended {
    opacity: 0.6;
  }
</style>