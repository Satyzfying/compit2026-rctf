<script lang="ts">
  import { Permissions } from '@rctf/types'
  import { useQueryClient } from '@tanstack/svelte-query'
  import { mergeProps } from '@zag-js/svelte'
  import { page } from '$app/state'
  import ThemeToggle from '$lib/components/theme-toggle.svelte'
  import {
    IconCopy,
    IconFlagBannerFold,
    IconGear,
    IconGlobeHemisphereWest,
    IconHouse,
    IconSignIn,
    IconSignOut,
    IconTableFilled,
    IconUserGear,
    IconX,
  } from '$lib/icons'
  import { useClientConfig } from '$lib/query/config'
  import { useCurrentUser } from '$lib/query/user'
  import Tooltip from '$lib/ui/tooltip.svelte'
  import { copyLoginUrl, logout } from '$lib/utils/auth'
  import {
    ADMIN_PANEL_PERMISSIONS,
    hasAnyPermission,
    hasPermissions,
  } from '$lib/utils/permissions'

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

  const navItems = $derived(
    [
      {
        href: '/',
        activePath: '/',
        label: 'Home',
        icon: IconHouse,
        show: true,
      },
      {
        href: '/challenges',
        activePath: '/challenges',
        label: 'Challenges',
        icon: IconFlagBannerFold,
        show: true,
      },
      {
        href: '/scores',
        activePath: '/scores',
        label: 'Scoreboard',
        icon: IconGlobeHemisphereWest,
        show: true,
      },
      {
        href: '/profile',
        activePath: '/profile',
        label: 'Manage team',
        icon: IconUserGear,
        show: !!user && !isArchived,
      },
      {
        href: '/admin/challenges',
        activePath: '/admin/challenges',
        label: 'Manage challenges',
        icon: IconFlagBannerFold,
        show: isAdmin && canReadChallenges,
      },
      {
        href: '/admin/teams',
        activePath: '/admin/teams',
        label: 'Manage teams',
        icon: IconUserGear,
        show: isAdmin && canManageUsers,
      },
      {
        href: '/admin/submissions',
        activePath: '/admin/submissions',
        label: 'Submissions',
        icon: IconTableFilled,
        show: isAdmin && canReadChallenges && canManageUsers,
      },
      {
        href: '/admin/settings',
        activePath: '/admin/settings',
        label: 'Settings',
        icon: IconGear,
        show: isAdmin && (canManageSettings || canManageUsers),
      },
    ].filter(item => item.show)
  )

  const isActive = (activePath: string) =>
    activePath === '/'
      ? page.url.pathname === '/'
      : page.url.pathname.startsWith(activePath)
</script>

<mobile-nav></mobile-nav>

<style>
  mobile-nav {
    display: block;

    @media (width >= 48rem) {
      display: none;
    }
  }

</style>
