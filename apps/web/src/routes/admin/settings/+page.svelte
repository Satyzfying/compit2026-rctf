<script lang="ts">
  import {
    GoodAdminSettingsUpdate,
    GoodFilesUploadV2,
    Permissions,
    UpdateAdminSettingsRouteV2,
    UploadFilesRouteV2,
  } from '@rctf/types'
  import { useQueryClient } from '@tanstack/svelte-query'
  import { apiRequest, showApiError } from '$lib/api'
  import MarkdownEditor from '$lib/components/markdown-editor.svelte'
  import { IconWarningCircle, IconX } from '$lib/icons'
  import { useAdminSettings } from '$lib/query/admin'
  import { useClientConfig } from '$lib/query/config'
  import { queryKeys } from '$lib/query/keys'
  import { useCurrentUser } from '$lib/query/user'
  import { toast } from '$lib/toast'
  import Button from '$lib/ui/button.svelte'
  import Card from '$lib/ui/card.svelte'
  import Field from '$lib/ui/field.svelte'
  import Input from '$lib/ui/input.svelte'
  import Spinner from '$lib/ui/spinner.svelte'
  import StatusCard from '$lib/ui/status-card.svelte'
  import { hasPermissions } from '$lib/utils/permissions'
  import ExternalAuthClients from './external-auth-clients.svelte'
  import UploadRow from './upload-row.svelte'
  import {
    buildPatch,
    clearDirty,
    formatDatetimeLocal,
    groupMatchesDefaults,
    initialFormState,
    parseDatetimeLocal,
    resetGroup,
    validateTiming,
    type SettingsFormState,
  } from './settings-model'

  const queryClient = useQueryClient()
  const userQuery = useCurrentUser()
  const user = $derived(userQuery.data)
  const canManageSettings = $derived(
    hasPermissions(user, Permissions.settingsWrite)
  )
  const canManageApps = $derived(hasPermissions(user, Permissions.usersWrite))

  const configQuery = useClientConfig()
  const settingsQuery = useAdminSettings(() => canManageSettings)

  const revealAfterLoading = settingsQuery.isPending

  const ctfName = $derived(configQuery.data?.ctfName)
  const defaults = $derived(settingsQuery.data?.defaults)

  let form = $state<SettingsFormState | null>(null)
  let initialized = $state(false)
  let saving = $state(false)

  $effect(() => {
    const data = settingsQuery.data
    if (!data || initialized) return
    form = initialFormState(data.overrides, data.defaults)
    initialized = true
  })

  const timingError = $derived(
    form && defaults
      ? validateTiming(
          form.timing.startTime,
          form.timing.endTime,
          !groupMatchesDefaults(form, 'timing', defaults)
        )
      : null
  )

  function markGroup(key: keyof SettingsFormState) {
    if (!form) return
    form[key].dirty = true
  }

  function resetGeneral() {
    if (!form || !defaults) return
    form.ctfName = resetGroup(defaults, 'ctfName')
    form.faviconUrl = resetGroup(defaults, 'faviconUrl')
  }

  function resetTiming() {
    if (!form || !defaults) return
    form.timing = resetGroup(defaults, 'timing')
  }

  function resetLogo() {
    if (!form || !defaults) return
    form.logo = resetGroup(defaults, 'logo')
  }

  function resetHome() {
    if (!form || !defaults) return
    form.homeContent = resetGroup(defaults, 'homeContent')
  }

  function resetMeta() {
    if (!form || !defaults) return
    form.meta = resetGroup(defaults, 'meta')
  }

  async function uploadImage(file: File): Promise<string | null> {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return null
    }
    try {
      const response = await apiRequest(UploadFilesRouteV2, { files: [file] })
      if (response.kind === GoodFilesUploadV2.kind) {
        const uploaded = response.data[0]
        if (!uploaded) {
          toast.error('Upload returned no file.')
          return null
        }
        return uploaded.url
      }
      showApiError(response)
      return null
    } catch {
      toast.error('Failed to upload image.')
      return null
    }
  }

  function setLogo(target: 'light' | 'dark', url: string) {
    if (!form) return
    form.logo[target] = url
    markGroup('logo')
  }

  async function uploadLogo(target: 'light' | 'dark', file: File) {
    const url = await uploadImage(file)
    if (url !== null) {
      setLogo(target, url)
    }
  }

  async function save() {
    if (!form || !defaults) return
    const error = validateTiming(
      form.timing.startTime,
      form.timing.endTime,
      !groupMatchesDefaults(form, 'timing', defaults)
    )
    if (error) {
      toast.error(error)
      return
    }
    const patch = buildPatch(form, defaults)
    if (Object.keys(patch).length === 0) {
      toast.info('No changes to save.')
      return
    }
    saving = true
    try {
      const response = await apiRequest(UpdateAdminSettingsRouteV2, {
        data: patch,
      })
      if (response.kind === GoodAdminSettingsUpdate.kind) {
        toast.success('Settings saved.')
        clearDirty(form)
        queryClient.invalidateQueries({ queryKey: queryKeys.clientConfig })
        queryClient.invalidateQueries({ queryKey: queryKeys.adminSettings })
      } else {
        showApiError(response)
      }
    } catch {
      toast.error('Failed to save settings.')
    } finally {
      saving = false
    }
  }
</script>

<svelte:head>
  {#if ctfName}
    <title>Settings | {ctfName}</title>
  {/if}
</svelte:head>

{#snippet groupHeader(title: string, onReset: () => void)}
  <group-header>
    <group-title>{title}</group-title>
    <button type="button" data-reset onclick={onReset}>Reset to default</button>
  </group-header>
{/snippet}

{#if canManageApps && !canManageSettings}
  <settings-page>
    <settings-form>
      <ExternalAuthClients />
    </settings-form>
  </settings-page>
{:else if !canManageSettings && user}
  <settings-status>
    <StatusCard
      icon={IconWarningCircle}
      title="Access denied"
      subtitle="Your account does not have permission to manage settings."
    >
      <Button href="/admin/challenges">Back to admin</Button>
    </StatusCard>
  </settings-status>
{:else if form && defaults}
  {@const settingsDefaults = defaults}
  {@const settingsForm = form}
  <settings-page data-reveal={revealAfterLoading || undefined}>
    <settings-form>
      <settings-group>
        {@render groupHeader('General', resetGeneral)}
        <group-body>
          <Field label="CTF name">
            {#snippet children({ id, describedBy })}
              <Input
                {id}
                aria-describedby={describedBy}
                value={settingsForm.ctfName.value}
                placeholder={settingsDefaults.ctfName}
                oninput={e => {
                  settingsForm.ctfName.value = e.currentTarget.value
                  markGroup('ctfName')
                }}
              />
            {/snippet}
          </Field>
          <Field label="Favicon URL">
            {#snippet children({ id, describedBy })}
              <Input
                {id}
                aria-describedby={describedBy}
                value={settingsForm.faviconUrl.value}
                placeholder={settingsDefaults.faviconUrl}
                oninput={e => {
                  settingsForm.faviconUrl.value = e.currentTarget.value
                  markGroup('faviconUrl')
                }}
              />
            {/snippet}
          </Field>
        </group-body>
      </settings-group>

      <settings-group>
        {@render groupHeader('Timing', resetTiming)}
        <group-body>
          <timing-grid>
            <Field label="CTF start (local time)">
              {#snippet children({ id, describedBy })}
                <Input
                  {id}
                  aria-describedby={describedBy}
                  type="datetime-local"
                  value={formatDatetimeLocal(settingsForm.timing.startTime)}
                  onchange={e => {
                    settingsForm.timing.startTime = parseDatetimeLocal(
                      e.currentTarget.value
                    )
                    markGroup('timing')
                  }}
                />
              {/snippet}
            </Field>
            <Field label="CTF end (local time)">
              {#snippet children({ id, describedBy })}
                <Input
                  {id}
                  aria-describedby={describedBy}
                  type="datetime-local"
                  value={formatDatetimeLocal(settingsForm.timing.endTime)}
                  onchange={e => {
                    settingsForm.timing.endTime = parseDatetimeLocal(
                      e.currentTarget.value
                    )
                    markGroup('timing')
                  }}
                />
              {/snippet}
            </Field>
          </timing-grid>
          {#if timingError}
            <field-error role="alert">{timingError}</field-error>
          {/if}
        </group-body>
      </settings-group>

      <settings-group>
        {@render groupHeader('Open Graph', resetMeta)}
        <group-body>
          <Field label="OG Description">
            {#snippet children({ id })}
              <Input
                {id}
                value={settingsForm.meta.description}
                placeholder={settingsDefaults.meta?.description}
                oninput={e => {
                  settingsForm.meta.description = e.currentTarget.value
                  markGroup('meta')
                }}
              />
            {/snippet}
          </Field>
          <Field label="OG Image URL">
            {#snippet children({ id })}
              <Input
                {id}
                value={settingsForm.meta.imageUrl}
                placeholder={settingsDefaults.meta?.imageUrl}
                oninput={e => {
                  settingsForm.meta.imageUrl = e.currentTarget.value
                  markGroup('meta')
                }}
              />
            {/snippet}
          </Field>
        </group-body>
      </settings-group>

      {#if canManageApps}
        <ExternalAuthClients />
      {/if}
    </settings-form>

    <save-bar>
      <bar-fade aria-hidden="true"></bar-fade>
      <Button onclick={save} disabled={saving}>
        {#if saving}<Spinner />{/if}
        Save changes
      </Button>
    </save-bar>
  </settings-page>
{:else if settingsQuery.isError}
  <settings-status>
    <Card title="Settings">
      <p>{settingsQuery.error?.message ?? 'Failed to load settings.'}</p>
    </Card>
  </settings-status>
{:else}
  <settings-status>
    <Spinner />
  </settings-status>
{/if}

<style>
  settings-status {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: var(--space-l);

    :global(ui-card) {
      inline-size: 100%;
      max-inline-size: 28rem;
    }

    p {
      margin: 0;
      color: var(--foreground-l3);
    }
  }

  settings-page {
    display: block;
    inline-size: 100%;
    max-inline-size: 72rem;
    margin-inline: auto;
    padding-inline: var(--space-m);
  }

  settings-form {
    display: grid;
    gap: var(--space-s);

    @media (min-width: 48rem) {
      grid-template-columns: repeat(2, minmax(22rem, 1fr));
    }

    > settings-group {
      animation: settings-group-in 420ms cubic-bezier(0.22, 1, 0.36, 1)
        backwards;

      &:nth-child(odd) {
        --settings-offset: -1.25rem;
      }

      &:nth-child(even) {
        --settings-offset: 1.25rem;
        animation-delay: 90ms;
      }

      &:last-child {
        @media (min-width: 48rem) {
          grid-column: 1 / -1;
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      > settings-group {
        animation: none;
      }
    }
  }

  @keyframes settings-group-in {
    from {
      opacity: 0;
      transform: translateX(var(--settings-offset, 0));
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  settings-group {
    display: block;
    overflow: clip;
    background: rgba(11, 19, 38, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(56, 189, 248, 0.22);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-s);
    padding: 0.375rem var(--space-s);
    background: #092d707a;
  }

  group-title {
    display: flex;
    align-items: center;
    gap: var(--space-2xs);
    color: var(--foreground-l3);
  }

  button[data-reset] {
    padding: 0;
    font-size: var(--step--1);
    color: #010241;
    background: none;
    border: none;
    cursor: pointer;

    &:hover {
      color: var(--foreground-l1);
    }
  }

  group-body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: var(--space-s);
  }

  field-error {
    display: block;
    font-size: var(--step--1);
    color: var(--foreground-destructive);
  }

  timing-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-s);
    color: rgba(39, 241, 191, 0.671);

    @media (min-width: 32rem) {
      grid-template-columns: 1fr 1fr;
    }
  }

  save-bar {
    position: sticky;
    inset-block-end: 0;
    z-index: 1;
    display: flex;
    padding-block: var(--space-s);
    background: transparent;

    :global(button) {
      inline-size: 100%;
    }
  }

  button {
          color: #0070d8;
      background: #4b74e4;
  }
  bar-fade {
    position: absolute;
    inset-inline: 0;
    inset-block-end: 100%;
    display: block;
    block-size: 1.5rem;
    pointer-events: none;
    background: linear-gradient(to top, var(--background-l0), transparent);
    opacity: 0;

    @supports (animation-timeline: scroll()) {
      animation: bar-fade-out linear both;
      animation-timeline: scroll(root);
      animation-range: calc(100% - 1.5rem) 100%;
    }
  }

  @keyframes bar-fade-out {
    from {
      opacity: 1;
    }

    to {
      opacity: 0;
    }
  }

</style>
