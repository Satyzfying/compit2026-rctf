<script lang="ts">
  import { page } from '$app/state'
  import type { Component } from 'svelte'

  type Props = {
    href?: string
    activePath?: string
    label: string
    icon: Component
    [key: string]: unknown
  }

  let { href, activePath, label, icon: Icon, ...rest }: Props = $props()

  const active = $derived.by(() => {
    if (!activePath) return false
    if (activePath === '/') return page.url.pathname === '/'
    return page.url.pathname.startsWith(activePath)
  })
</script>

{#if href}
  <a
    {href}
    aria-label={label}
    aria-current={active ? 'page' : undefined}
    data-active={active ? '' : undefined}
    {...rest}
  >
    <Icon />
  </a>
{:else}
  <button
    type="button"
    aria-label={label}
    data-active={active ? '' : undefined}
    {...rest}
  >
    <Icon />
  </button>
{/if}

<style>
  a,
  button {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1rem;
    font-size: 1.5rem;
    color: var(--foreground-l2);
    background: transparent;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: color 200ms ease;

    &:hover {
      background: var(--background-l3);
    }

    &[data-active] {
      color: var(--foreground-accent);

      &:hover {
        background: transparent;
      }
    }

    :global(svg) {
      flex-shrink: 0;
    }
  }

  button[data-admin-trigger],
  button[data-admin-trigger] :global(svg) {
    color: #2987ca !important;
    fill: #2987ca !important;
  }

  button[data-admin-trigger]:hover,
  button[data-admin-trigger]:hover :global(svg) {
    color: #7ee8ff !important;
    fill: #7ee8ff !important;
    background: linear-gradient(180deg, rgba(8, 22, 34, 0.97), rgba(6, 20, 32, 0.92));
  }
</style>