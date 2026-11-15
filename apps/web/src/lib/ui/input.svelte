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
    block-size: 2.375rem;
    padding-inline: var(--space-xs);
    color: var(--foreground-l0, #f8fafc);
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: var(--radius-md);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &::placeholder {
      color: rgba(148, 163, 184, 0.65);
    }

    &:focus-visible {
      outline: none;
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
    }

    &[aria-invalid='true'] {
      border-color: var(--foreground-destructive);
    }
  }
</style>
