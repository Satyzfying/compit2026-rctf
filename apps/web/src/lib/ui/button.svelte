<script lang="ts">
  import type { Snippet } from 'svelte'
  import type {
    HTMLAnchorAttributes,
    HTMLButtonAttributes,
  } from 'svelte/elements'

  type BaseProps = {
    variant?:
      | 'default'
      | 'destructive'
      | 'outline'
      | 'secondary'
      | 'ghost'
      | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'
    disabled?: boolean
    children?: Snippet
  }

  type AnchorProps = Omit<HTMLAnchorAttributes, 'href'> & { href: string }
  type ButtonProps = HTMLButtonAttributes & { href?: undefined }

  type Props = BaseProps & (AnchorProps | ButtonProps)

  let {
    variant = 'default',
    size = 'default',
    disabled,
    children,
    ...rest
  }: Props = $props()
</script>

{#if rest.href !== undefined}
  {@const { href, ...anchorRest } = rest as AnchorProps}
  <a
    data-variant={variant}
    data-size={size}
    href={disabled ? undefined : href}
    aria-disabled={disabled || undefined}
    role={disabled ? 'link' : undefined}
    tabindex={disabled ? -1 : undefined}
    {...anchorRest}
  >
    {@render children?.()}
  </a>
{:else}
  {@const { type = 'button', ...buttonRest } = rest as Omit<
    ButtonProps,
    'href'
  >}
  <button
    data-variant={variant}
    data-size={size}
    {type}
    {disabled}
    {...buttonRest}
  >
    {@render children?.()}
  </button>
{/if}

<style>
  a,
  button {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    gap: var(--space-2xs);
    block-size: 2.25rem;
    padding-inline: var(--space-s);
    color: var(--foreground-l1);
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    border-radius: var(--radius-md);

    :global(svg) {
      inline-size: 1em;
      block-size: 1em;
      flex-shrink: 0;
      pointer-events: none;
    }

    &[data-size='sm'] {
      block-size: 2rem;
      padding-inline: var(--space-xs);
    }

    &[data-size='lg'] {
      block-size: 2.5rem;
      padding-inline: var(--space-m);
    }

    &[data-size='icon'] {
      inline-size: 2.25rem;
      padding-inline: 0;
    }

    &[data-size='icon-sm'] {
      inline-size: 2rem;
      block-size: 2rem;
      padding-inline: 0;
    }

    &[data-size='icon-lg'] {
      inline-size: 2.5rem;
      block-size: 2.5rem;
      padding-inline: 0;
    }

    &[data-variant='default'] {
      color: #ffffff;
      font-weight: 500;
      background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%);
      border: 1px solid rgba(56, 189, 248, 0.35);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      transition: all 0.15s ease;

      &:hover {
        background: linear-gradient(180deg, #0369a1 0%, #075985 100%);
      }

      &:active:enabled {
        transform: scale(0.98);
      }
    }

    &[data-variant='destructive'] {
      color: var(--foreground-destructive);
      background: var(--background-destructive);

      &:hover {
        background: var(--background-destructive-hover);
      }
    }

    &[data-variant='outline'] {
      color: #cbd5e1;
      font-weight: 500;
      background: rgba(10, 22, 42, 0.8);
      border: 1px solid rgba(56, 189, 248, 0.2);
      backdrop-filter: blur(8px);
      transition: all 0.15s ease;

      &:hover {
        color: #f1f5f9;
        background: rgba(16, 34, 64, 0.9);
        border-color: rgba(56, 189, 248, 0.4);
      }
    }

    &[data-variant='secondary'] {
      color: #cbd5e1;
      font-weight: 500;
      background: rgba(15, 28, 50, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.15);
      transition: all 0.15s ease;

      &:hover {
        color: #f1f5f9;
        background: rgba(22, 42, 74, 0.9);
        border-color: rgba(56, 189, 248, 0.3);
      }
    }

    &[data-variant='ghost']:hover {
      background: var(--background-l3);
    }

    &[data-variant='link'] {
      color: var(--foreground-prose-link);
      text-underline-offset: 4px;

      &:hover {
        text-decoration: underline;
      }
    }

    &:disabled,
    &[aria-disabled='true'] {
      pointer-events: none;
      opacity: 0.5;
    }

    &:focus-visible {
      outline: 2px solid var(--ring);
    }
  }
</style>
