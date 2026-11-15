<script lang="ts">
  import { onMount } from 'svelte'

  type Pixel = {
    x: number
    y: number
    group: 'arrow' | 'bubble'
    type: 'solid' | 'outline' | 'fill' | 'shine'
  }
  type Trail = { id: number; x: number; y: number; size: number; drift: number }

  const CELL = 3
  
  const CANVAS_W = 18
  const CANVAS_H = 21

  function buildArrow(offsetX: number, offsetY: number): Pixel[] {
    const px: Pixel[] = []
  
    const length = 4; 
    const thickness = 1; 
    for (let row = 0; row < length; row++) {
      for (let col = 0; col < length; col++) {
        if (row < thickness || col < thickness) {
          px.push({ x: col + offsetX, y: row + offsetY, group: 'arrow', type: 'solid' })
        }
      }
    }
    return px
  }

  function buildBubble(size: number, offsetX: number, offsetY: number): Pixel[] {
    const px: Pixel[] = []
    const c = (size - 1) / 2
    const outer = size / 2 - 0.5
    const inner = outer - 1.6
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - c
        const dy = y - c
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d > outer) continue
        if (d >= inner) {
          px.push({ x: x + offsetX, y: y + offsetY, group: 'bubble', type: 'outline' })
        } else {
          const glow = (-dx - dy) / (2 * outer)
          px.push({
            x: x + offsetX,
            y: y + offsetY,
            group: 'bubble',
            type: glow > 0.15 ? 'shine' : 'fill',
          })
        }
      }
    }
    return px
  }

  const arrowPixels: Pixel[] = buildArrow(0, 0)
  const bubblePixels: Pixel[] = buildBubble(10, 2, 3)

  let cursorEl: HTMLDivElement | undefined = $state()
  let active = $state(false)
  let hovering = $state(false)
  let trail: Trail[] = $state([])

  let trailId = 0

  onMount(() => {
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (!hasFinePointer || prefersReducedMotion) return

    active = true
    document.documentElement.classList.add('custom-cursor-active')

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let posX = mouseX
    let posY = mouseY
    let rafId: number
    let lastTrailAt = 0
    let hideTimeout: ReturnType<typeof setTimeout> | undefined

    const showCursor = () => {
      if (cursorEl) cursorEl.style.opacity = '1'
      clearTimeout(hideTimeout)
      hideTimeout = setTimeout(() => {
        if (cursorEl) cursorEl.style.opacity = '0'
      }, 400)
    }

    const spawnTrail = (x: number, y: number) => {
      const id = trailId++
      const size = 3 + Math.random() * 3
      const drift = (Math.random() - 0.5) * 30
      trail = [...trail, { id, x, y, size, drift }]
      setTimeout(() => {
        trail = trail.filter(t => t.id !== id)
      }, 900)
    }

    const onPointerMove = (event: PointerEvent) => {
      mouseX = event.clientX
      mouseY = event.clientY
      showCursor()

      const target = event.target
      hovering =
        target instanceof Element &&
        target.closest(
          'a, button, [role="button"], input, textarea, select, summary, [data-cursor-hover]',
        ) !== null

      const now = performance.now()
      if (now - lastTrailAt > 130) {
        lastTrailAt = now
        spawnTrail(mouseX, mouseY)
      }
    }

    const tick = () => {
      posX += (mouseX - posX) * 0.25
      posY += (mouseY - posY) * 0.25
      if (cursorEl) {
        cursorEl.style.transform =
          `translate(${posX}px, ${posY}px)`
      }
      rafId = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onPointerMove)
    rafId = requestAnimationFrame(tick)

    return () => {
      document.documentElement.classList.remove('custom-cursor-active')
      window.removeEventListener('pointermove', onPointerMove)
      clearTimeout(hideTimeout)
      cancelAnimationFrame(rafId)
    }
  })
</script>

{#if active}
  {#each trail as t (t.id)}
    <div
      class="pixel-trail"
      style="
        inset-block-start: {t.y}px;
        inset-inline-start: {t.x}px;
        inline-size: {t.size}px;
        block-size: {t.size}px;
        --drift: {t.drift}px;
      "
    ></div>
  {/each}

  <div class="pixel-cursor" class:hovering bind:this={cursorEl}>
    <svg
      viewBox="0 0 {CANVAS_W * CELL} {CANVAS_H * CELL}"
      width={CANVAS_W * CELL}
      height={CANVAS_H * CELL}
      shape-rendering="crispEdges"
    >
      <g class="arrow-bob">
        {#each arrowPixels as p (p.group + '-' + p.x + '-' + p.y)}
          <rect
            class="px-{p.group}-{p.type}"
            x={p.x * CELL}
            y={p.y * CELL}
            width={CELL}
            height={CELL}
          />
        {/each}
      </g>
      {#each bubblePixels as p (p.group + '-' + p.x + '-' + p.y)}
        <rect
          class="px-{p.group}-{p.type}"
          x={p.x * CELL}
          y={p.y * CELL}
          width={CELL}
          height={CELL}
        />
      {/each}
    </svg>
  </div>
{/if}

<style>
  .pixel-cursor {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: var(--layer-toast, 9999);
    pointer-events: none;
    image-rendering: pixelated;
    transition: opacity 150ms ease;
  }

  .pixel-cursor svg {
    display: block;
    inline-size: 54px;
    block-size: 63px;
    transition: inline-size 150ms steps(4), block-size 150ms steps(4);
    filter: drop-shadow(0 2px 0 rgba(2, 38, 110, 0.25));
  }

  .pixel-cursor.hovering svg {
    inline-size: 68px;
    block-size: 79px;
  }

  /* Arrow bobs up and down, pixel-stepped to match the pixel-art style */
  .arrow-bob {
    animation: arrow-bob 900ms steps(2) infinite alternate;
    transform-box: fill-box;
    transform-origin: center;
  }

  .pixel-cursor.hovering .arrow-bob {
    animation-duration: 600ms;
  }

  @keyframes arrow-bob {
    from {
      transform: translateY(0px);
    }
    to {
      transform: translateY(-3px);
    }
  }

  .px-arrow-solid {
    fill: #84e1fd;
    filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
  }
  .pixel-cursor.hovering .px-arrow-solid {
    fill: #ffffff;
  }

  .px-bubble-outline {
    fill: #6dccff;
  }
  .px-bubble-fill {
    fill: #6bc6f7;
    fill-opacity: 0.9;
  }
  .px-bubble-shine {
    fill: #f3fbff;
  }

  .pixel-cursor.hovering .px-bubble-outline {
    fill: #e15fa8;
  }
  .pixel-cursor.hovering .px-bubble-fill {
    fill: #f5c9e4;
  }
  .pixel-cursor.hovering .px-bubble-shine {
    fill: #ffffff;
  }

  .pixel-trail {
    position: fixed;
    z-index: var(--layer-toast, 9999);
    translate: -50% -50%;
    image-rendering: pixelated;
    background: #9fd8f2;
    border: 1px solid #1e7fbf;
    pointer-events: none;
    animation: pixel-rise 900ms steps(6) forwards;
  }

  @keyframes pixel-rise {
    from {
      opacity: 0.8;
      transform: translate(-50%, -50%) translate(0, 0);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -50%) translate(var(--drift), -60px);
    }
  }

  @media (pointer: coarse) {
    .pixel-cursor,
    .pixel-trail {
      display: none;
    }
  }
</style>