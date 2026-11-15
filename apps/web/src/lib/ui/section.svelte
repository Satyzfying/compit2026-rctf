<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    title: string
    flush?: boolean
    children: Snippet
  }

  let { title, flush = false, children }: Props = $props()
</script>

<ui-section>
  <section-header>{title}</section-header>
  <section-content data-flush={flush || undefined}
    >{@render children()}</section-content
  >
</ui-section>

<style>
  ui-section {
    display: block;
    overflow: clip;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    background: #11141c;
  }

  section-header {
    display: flex;
    gap: var(--space-2xs);
    align-items: center;
    justify-content: space-between;
    padding: 0.45rem 0.85rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #a3a9b8;
    background: #161922;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  section-content {
    display: block;
    padding: 0.75rem 0.85rem;

    &[data-flush] {
      padding: 0;
    }
  }
</style>
