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
    gap: 0.625rem;
    block-size: 2.35rem;
    padding-inline: 1rem;
    background: transparent;
    border: 1px solid #0bad5c;
    border-radius: var(--radius-lg);

    @media (width < 64rem) {
      display: none;
    }
  }

  countdown-label {
    display: block;
    font-family: Cormorant Garamond;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #2c9fec;
    text-transform: uppercase;
    white-space: nowrap;
    font-family: Tangerine;
  }

  .divider {
    display: block;
    inline-size: 1px;
    block-size: 2rem;
    background: #1f5d7f;
    flex-shrink: 0;
  }

  countdown-time {
    display: block;
    font-family: Numans;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #c0ff13;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  nav-countdown.ended {
    opacity: 0.6;
  }
</style>