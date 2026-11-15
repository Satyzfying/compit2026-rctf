<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    title?: string
    description?: string
    children: Snippet
  }

  let { title, description, children }: Props = $props()
</script>

<ui-card>
  {#if title || description}
    <card-header>
      {#if title}
        <card-title>{title}</card-title>
      {/if}
      {#if description}
        <card-description>{description}</card-description>
      {/if}
    </card-header>
  {/if}
  {@render children()}
</ui-card>

<style>
  ui-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    padding: var(--space-s-m);
    background: rgba(11, 19, 38, 0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(56, 189, 248, 0.16);
    box-shadow:
      0 20px 40px -12px rgba(0, 0, 0, 0.7),
      0 0 24px rgba(56, 189, 248, 0.04);
    border-radius: var(--radius-lg);
  }

  card-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
  }

  card-title {
    display: block;
    font-size: var(--step-1);
    font-weight: 600;
    color: var(--foreground-l0, #ffffff);
  }

  card-description {
    display: block;
    font-size: var(--step--1);
    color: var(--foreground-l3, #94a3b8);
  }
</style>
