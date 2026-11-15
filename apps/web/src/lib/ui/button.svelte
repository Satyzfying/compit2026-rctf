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
      color: blur(0.5, 0.5, 0.5, 0.5);
      background: linear-gradient(
        180deg,
        color-mix(in srgb, rgba(39, 39, 244, 0.774) 75%, transparent 5%),
        color-mix(in srgb, rgb(23, 183, 204) 55%, transparent 5%)
      );

      &:hover {
        background: color-mix(in srgb, rgba(94, 94, 254, 0.7) 75%, transparent);
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
      background: var(--background-l1);
      border: 2px solid var(--border);

      &:hover {
        background: var(--background-l2);
      }
    }

    &[data-variant='secondary'] {
      background: var(--background-l4);

      &:hover {
        background: var(--background-l5);
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
