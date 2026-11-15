<script lang="ts">
  import { afterNavigate } from '$app/navigation'
  import { page } from '$app/state'
  import { onMount } from 'svelte'

  const bubbleCount = 34
  const bubbles = Array.from({ length: bubbleCount }, (_, index) => ({
    index,
    size: 0.35 + ((index * 17) % 13) / 10,
    left: (index * 37) % 101,
    delay: ((index * 29) % 700) / 1000,
    duration: 650 + ((index * 47) % 500),
  }))

  let mounted = $state(false)
  let transitioning = $state(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  const isAnimatedRoute = $derived(
    !page.url.pathname.startsWith('/admin') &&
      ['/scores', '/challenges', '/rules'].some(path =>
        page.url.pathname === path || page.url.pathname.startsWith(`${path}/`)
      )
  )

  function startTransition() {
    if (!mounted || !isAnimatedRoute) return
    transitioning = false
    requestAnimationFrame(() => {
      transitioning = true
      clearTimeout(timer)
      timer = setTimeout(() => (transitioning = false), 1250)
    })
  }

  afterNavigate(startTransition)

  onMount(() => {
    mounted = true
    return () => {
      clearTimeout(timer)
    }
  })
</script>

{#if isAnimatedRoute}
  <route-bubble-transition class:active={transitioning} aria-hidden="true">
    {#each bubbles as bubble (bubble.index)}
      <i
        style:--bubble-size={`${bubble.size}rem`}
        style:--bubble-left={`${bubble.left}%`}
        style:--bubble-delay={`${bubble.delay}s`}
        style:--bubble-duration={`${bubble.duration}ms`}
      ></i>
    {/each}
  </route-bubble-transition>
{/if}

<style>
  route-bubble-transition {
    position: fixed;
    z-index: 100;
    inset: 0;
    display: block;
    overflow: hidden;
    pointer-events: none;
    opacity: 0;
  }

  route-bubble-transition.active {
    opacity: 1;
  }

  i {
    position: absolute;
    inset-block-end: calc(-1 * var(--bubble-size));
    inset-inline-start: var(--bubble-left);
    display: block;
    inline-size: var(--bubble-size);
    block-size: var(--bubble-size);
    border: 1px solid rgb(112 235 225 / 48%);
    border-radius: 50%;
    background: radial-gradient(
      circle at 35% 30%,
      rgb(136 244 232 / 76%),
      rgb(29 137 190 / 64%) 52%,
      rgb(12 35 92 / 82%)
    );
    box-shadow: 0 0 1.5rem rgb(59 218 221 / 28%);
    opacity: 0;
    transform: translateY(0) scale(0.6);
  }

  .active i {
    animation: bubble-slide var(--bubble-duration) cubic-bezier(0.2, 0.75, 0.25, 1)
      var(--bubble-delay) both;
  }

  @keyframes bubble-slide {
    0% {
      opacity: 0;
      transform: translateY(0) scale(0.6);
    }
    18% {
      opacity: 0.9;
    }
    78% {
      opacity: 0.82;
    }
    100% {
      opacity: 0;
      transform: translateY(-115dvh) scale(1.35);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    route-bubble-transition {
      display: none;
    }
  }
</style>
