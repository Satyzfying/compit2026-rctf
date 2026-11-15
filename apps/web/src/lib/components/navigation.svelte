<script lang="ts">
  import { Permissions } from '@rctf/types'
  import { slide } from 'svelte/transition'
  import { useQueryClient } from '@tanstack/svelte-query'
  import { mergeProps } from '@zag-js/svelte'
  import { page } from '$app/state'
  import NavigationButton from '$lib/components/navigation-button.svelte'
  import NavigationCountdown from '$lib/components/navigation-countdown.svelte'
  import NavigationMobile from '$lib/components/navigation-mobile.svelte'
  import ThemeToggle from '$lib/components/theme-toggle.svelte'
  import imageBackground from '$lib/assets/background-theme.svg'
  import {
    IconCopy,
    IconFlagBannerFold,
    IconGavel,
    IconGear,
    IconSignIn,
    IconSignOut,
    IconTableFilled,
    IconUserGear,
  } from '$lib/icons'
  import { useClientConfig } from '$lib/query/config'
  import { useCurrentUser } from '$lib/query/user'
  import Menu from '$lib/ui/menu.svelte'
  import Tooltip from '$lib/ui/tooltip.svelte'
  import { copyLoginUrl, logout } from '$lib/utils/auth'
  import {
    ADMIN_PANEL_PERMISSIONS,
    hasAnyPermission,
    hasPermissions,
  } from '$lib/utils/permissions'
  import { createRovingFocus } from '$lib/utils/roving'

  const rovingFocus = createRovingFocus()

  let moreOpen = $state(false)

  function clickOutside(node: HTMLElement, callback: () => void) {
    function handleClick(event: MouseEvent) {
      if (node && !node.contains(event.target as Node)) {
        callback()
      }
    }
    document.addEventListener('click', handleClick, true)

    return {
      destroy() {
        document.removeEventListener('click', handleClick, true)
      },
    }
  }

  const queryClient = useQueryClient()
  const configQuery = useClientConfig()
  const clientConfig = $derived(configQuery.data)
  const userQuery = useCurrentUser()
  const user = $derived(userQuery.data)

  const isArchived = $derived(clientConfig?.isArchived ?? false)
  const canReadChallenges = $derived(
    hasPermissions(user, Permissions.challsRead)
  )
  const canManageUsers = $derived(hasPermissions(user, Permissions.usersWrite))
  const canManageSettings = $derived(
    hasPermissions(user, Permissions.settingsWrite)
  )
  const isAdmin = $derived(hasAnyPermission(user, ADMIN_PANEL_PERMISSIONS))

  const moreLinks = [
    { label: 'Challenges', href: '/challenges' },
    { label: 'Scoreboard', href: '/scores' },
    { label: 'Rules', href: '/rules' },
  ]

  const adminMenuItems = $derived(
    [
      {
        value: 'admin-challenges',
        label: 'Manage challenges',
        icon: IconFlagBannerFold,
        href: '/admin/challenges',
        show: canReadChallenges,
      },
      {
        value: 'admin-teams',
        label: 'Manage teams',
        icon: IconUserGear,
        href: '/admin/teams',
        show: canManageUsers,
      },
      {
        value: 'admin-submissions',
        label: 'Submissions',
        icon: IconTableFilled,
        href: '/admin/submissions',
        show: canReadChallenges && canManageUsers,
      },
      {
        value: 'admin-settings',
        label: 'Settings',
        icon: IconGear,
        href: '/admin/settings',
        show: canManageSettings || canManageUsers,
      },
    ].filter(item => item.show)
  )

  const userMenuItems = $derived([
    {
      value: 'copy-login-url',
      label: 'Copy login URL',
      icon: IconCopy,
      onSelect: () => {
        if (user?.teamToken) copyLoginUrl(user.teamToken)
      },
    },
    {
      value: 'profile',
      label: 'Manage team',
      icon: IconUserGear,
      href: '/profile',
    },
    {
      value: 'logout',
      label: 'Log out',
      icon: IconSignOut,
      onSelect: () => logout(queryClient),
    },
  ])
</script>

<header
  class="center bg"
  style="background-image: radial-gradient(ellipse at center, rgba(6, 14, 32, 0.76) 0%, rgba(3, 7, 18, 0.94) 100%), linear-gradient(to bottom, rgba(3, 7, 18, 0.82) 0%, transparent 20%, transparent 80%, rgba(3, 7, 18, 0.9) 100%), url({imageBackground})"
></header>

<header class="nav-side">

  <NavigationMobile />

  {#if page.url.pathname === '/'}
    <div class="more-menu" use:clickOutside={() => (moreOpen = false)}>
      <button
        type="button"
        onclick={() => (moreOpen = !moreOpen)}
        aria-expanded={moreOpen}
      >
        <span>Options</span>
        <span class="chevron" class:open={moreOpen}>☰</span>
      </button>

      {#if moreOpen}
        <ul class="more-list" transition:slide={{ duration: 150 }}>
          {#each moreLinks as link}
            <li>
              <a href={link.href} onclick={() => (moreOpen = false)}>
                {link.label}
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
  {#if page.url.pathname !== '/'}
    <button
      class="back-box"
      type="button"
      onclick={() => (window.location.href = '/')}
    >
      ← Go back
    </button>
  {/if}
</header>

<header class="nav-top-right">
  {#if isAdmin}
    <nav aria-label="Main" {@attach rovingFocus}>
      <Menu label="Admin menu" items={adminMenuItems}>
        {#snippet trigger({ props: menuProps })}
          <NavigationButton
            {...menuProps}
            data-roving
            data-admin-trigger
            style="color: #00d4ff;"
            background="linear-gradient(180deg, rgba(8, 22, 34, 0.97), rgba(6, 20, 32, 0.92))"
            activePath="/admin"
            label="Admin menu"
            icon={IconGavel}
          />
        {/snippet}
      </Menu>
    </nav>
  {/if}

  <NavigationCountdown />

  {#if user && !isArchived}
    <Menu label="Account" items={userMenuItems} placement="bottom-end">
      {#snippet trigger({ props })}
        <button {...props} class="profile-menu-trigger">
          <profile-badge>{user.name}</profile-badge>
        </button>
      {/snippet}
    </Menu>
  {:else if !user && !isArchived}
    <span class="nav-end-pill">

      <a href="/login">Login</a>
    </span>
  {/if}
</header>

<style>
  header {
    position: fixed;
    z-index: var(--layer-nav);
    padding: 0.75rem 1rem;
    background: transparent;

    @media (width >= 48rem) {
      padding: 1.5rem 2.25rem;
    }
  }

  .nav-side {
    inset-block-start: 0;
    inset-inline-start: 0;
    display: flex;
    align-items: flex-start;
    gap: var(--space-s);

    @media (width >= 48rem) {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-m);
    }
  }

  .nav-top-right {
    inset-block-start: 0;
    inset-inline-end: 0;
    display: none;
    align-items: center;
    gap: var(--space-xs);

    @media (width >= 48rem) {
      display: flex;
    }
  }

  .nav-bottom-right {
    inset-block-end: 0;
    inset-inline-end: 0;
    display: none;
    align-items: center;
    gap: var(--space-xs);

    @media (width >= 48rem) {
      display: flex;
    }
  }

  /* h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #6fe0ff;

    @media (width >= 48rem) {
      font-size: 1rem;
    }
  } */
  .center {
    inset: 0;
    z-index: -1;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .bg {
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
  }

  nav {
    position: relative;
    display: none;
    align-items: center;
    gap: var(--space-2xs);

    @media (width >= 48rem) {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-2xs);
    }
  }

  .more-menu {
    position: relative;
  }

  .more-menu > button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.85rem;
    block-size: 2.125rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #cbd5e1;
    background: rgba(10, 22, 42, 0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      color: #f1f5f9;
      background: rgba(16, 34, 64, 0.9);
      border-color: rgba(56, 189, 248, 0.4);
    }
  }

  .chevron {
    display: inline-block;
    transition: transform 150ms ease;
  }

  .chevron.open {
    transform: rotate(90deg);
  }

  .more-list {
    position: absolute;
    inset-block-start: calc(100% + 0.35rem);
    inset-inline-start: 0;
    z-index: var(--layer-popover);
    inline-size: max-content;
    min-inline-size: 100%;
    margin: 0;
    padding: 0.25rem;
    list-style: none;
    background: rgba(10, 22, 42, 0.94);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: var(--radius-md);
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.6);
  }

  .more-list li a {
    display: block;
    inline-size: 100%;
    padding: 0.45rem 0.75rem;
    color: #cbd5e1;
    text-decoration: none;
    font-size: 0.875rem;
    border-radius: var(--radius-sm);
    transition: all 0.12s ease;

    &:hover {
      color: #ffffff;
      background: rgba(56, 189, 248, 0.14);
    }
  }

  .back-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.85rem;
    block-size: 2.125rem;
    inline-size: auto;
    font-size: 0.875rem;
    font-weight: 500;
    color: #cbd5e1;
    background: rgba(10, 22, 42, 0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      color: #f1f5f9;
      background: rgba(16, 34, 64, 0.9);
      border-color: rgba(56, 189, 248, 0.4);
    }
  }

  .nav-end-pill :global(a),
  .nav-end-pill :global(button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ffffff !important;
    background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%) !important;
    border: 1px solid rgba(56, 189, 248, 0.35) !important;
    border-radius: var(--radius-md) !important;
    padding: 0.35rem 0.9rem !important;
    block-size: 2.125rem !important;
    font-weight: 500 !important;
    font-size: 0.875rem !important;
    text-decoration: none;
    transition: all 0.15s ease;

    &:hover {
      background: linear-gradient(180deg, #0369a1 0%, #075985 100%) !important;
    }
  }

  [data-scope='menu'][data-part='trigger'] {
    display: flex;
    align-items: center;
    justify-content: center;
    inline-size: auto;
    min-inline-size: 2.5rem;
    block-size: 2.125rem;
    padding-inline: 0.85rem;
    color: #cbd5e1;
    background: rgba(10, 22, 42, 0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      color: #f1f5f9;
      background: rgba(16, 34, 64, 0.9);
      border-color: rgba(56, 189, 248, 0.4);
    }
  }

  button[data-admin-trigger],
  button[data-admin-trigger] :global(svg) {
    color: #38bdf8 !important;
    border-color: rgba(56, 189, 248, 0.25) !important;
  }

  button[data-admin-trigger]:hover,
  button[data-admin-trigger]:hover :global(svg) {
    color: #ffffff !important;
    border-color: #38bdf8 !important;
  }

  .profile-menu-trigger {
    padding-inline: 0.75rem;
  }

  profile-badge {
    display: block;
    max-inline-size: 12rem;
    overflow: hidden;
    font-family: var(--font-mono, monospace);
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: #ededed;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>