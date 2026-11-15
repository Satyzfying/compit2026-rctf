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
    background: linear-gradient(
      135deg,
      color-mix(in oklab, rgba(14, 24, 138, 0.695) 50%, rgb(1, 43, 43) 25%),
      color-mix(in oklab, rgb(22, 46, 53) 35%, transparent 28%)
    );
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
  }

  card-description {
    display: block;
    font-size: var(--step--1);
    color: rgb(139, 208, 238);
  }
</style>
