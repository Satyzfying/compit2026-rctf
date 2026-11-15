<script lang="ts">
  import { onMount } from 'svelte'
  import { IconClock, IconGear, IconMoonStars, IconSun } from '$lib/icons'
  import { useClientConfig } from '$lib/query/config'

  type Mode = 'light' | 'auto' | 'dark'

  let mode: Mode = $state('auto')
  let open = $state(false)

  const configQuery = useClientConfig()
  const clientConfig = $derived(configQuery.data)

  function getAutoTheme(): 'light' | 'dark' {
    const startTime = clientConfig?.startTime ?? 0
    const endTime = clientConfig?.endTime ?? 0
    const now = Date.now()

    if (!startTime || !endTime || endTime <= startTime) return 'light'
    if (now <= startTime) return 'light'
    if (now >= endTime) return 'dark'

    const progress = (now - startTime) / (endTime - startTime)
    return progress < 0.5 ? 'light' : 'dark'
  }

  function applyTheme(currentMode: Mode) {
    const root = document.documentElement
    root.dataset.theme = currentMode === 'auto' ? getAutoTheme() : currentMode
    localStorage.setItem('session-mode', currentMode)
  }

  function setMode(newMode: Mode) {
    mode = newMode
    applyTheme(mode)
  }

  onMount(() => {
    mode = (localStorage.getItem('session-mode') as Mode | null) ?? 'auto'
    applyTheme(mode)

    const intervalId = setInterval(() => {
      if (mode === 'auto') applyTheme('auto')
    }, 60_000)

    return () => clearInterval(intervalId)
  })
</script>

<div class="theme-popover" role="group" aria-label="Theme settings" onmouseleave={() => (open = false)}>
  <button
    type="button"
    class="trigger"
    aria-label="Theme settings"
    aria-expanded={open}
    onmouseenter={() => (open = !open)}
  >
    <IconGear />
  </button>

  {#if open}
    <div class="theme-mode-group" role="radiogroup" aria-label="Theme mode">
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'light'}
        class:active={mode === 'light'}
        onclick={() => setMode('light')}
      >
        <IconSun />
        <span>Day</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'auto'}
        class:active={mode === 'auto'}
        onclick={() => setMode('auto')}
      >
        <IconClock />
        <span>Auto</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'dark'}
        class:active={mode === 'dark'}
        onclick={() => setMode('dark')}
      >
        <IconMoonStars />
        <span>Night</span>
      </button>
    </div>
  {/if}
</div>

<style>
  .theme-popover {
    position: relative;
    margin-inline-end: 3.75rem;
  }

  .trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    font-size: 1.5rem;
    color: #9ad7b5;
    background: transparent;
    border-radius: var(--radius-lg);
    cursor: pointer;

    &:hover,
    &[aria-expanded='true'] {
      color: #bfead0;
      background: transparent;
    }

    :global(svg) {
      transition: transform 200ms ease;
    }

    &[aria-expanded='true'] :global(svg) {
      animation: gear-spin 1.6s linear infinite;
    }
  }

  @keyframes gear-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .theme-mode-group {
    position: absolute;
    inset-block-end: 100%;
    inset-inline-start: 50%;
    z-index: var(--layer-popover);
    display: flex;
    gap: 0.25rem;
    margin-block-end: 0.5rem;
    padding: 0.25rem;
    background: #0c1e4ec5;
    border: 1px solid #2688ced0;
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 24px color-mix(in oklab, black 40%, transparent);
    animation: pop-in 150ms ease;
    transform: translateX(-50%);
  }

  .theme-mode-group::after {
    content: '';
    position: absolute;
    inset-block-start: 100%;
    inset-inline: 0;
    block-size: 0.5rem;
  }

  @keyframes pop-in {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(4px);
    }
  }

  .theme-mode-group button {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #448685;
    white-space: nowrap;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition:
      color 150ms ease,
      background 150ms ease,
      border-color 150ms ease,
      box-shadow 150ms ease;

    &:hover {
      color: #306A98;
      background: #306A98;
    }

    &.active {
      color: #448685;
      background: #0C1E4E;
      border-color: #81C0D1;
      box-shadow: 0 0 12px color-mix(in oklab, #306A98 55%, transparent);
    }

    :global(svg) {
      inline-size: 1.1em;
      block-size: 1.1em;
      flex-shrink: 0;
    }
  }
</style>