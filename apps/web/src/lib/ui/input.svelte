<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements'

  type Props = HTMLInputAttributes

  let { value = $bindable(), ...rest }: Props = $props()
</script>

<input bind:value {...rest} />

<style>
  input {
    display: block;
    inline-size: 100%;
    block-size: 2.25rem;
    padding-inline: 0.75rem;
    color: #f1f5f9;
    background: rgba(6, 14, 28, 0.75);
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 8px;
    font-size: 0.875rem;
    transition: all 0.15s ease;

    &::placeholder {
      color: rgba(148, 163, 184, 0.55);
    }

    &:focus-visible {
      outline: none;
      border-color: #38bdf8;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25);
      background: rgba(8, 18, 36, 0.9);
    }

    &[aria-invalid='true'] {
      border-color: var(--foreground-destructive);
    }
  }
</style>
