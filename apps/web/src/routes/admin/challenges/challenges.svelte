<script lang="ts">
  import {
    DeleteChallengeRoute,
    GoodChallengeDelete,
    GoodChallengeUpdateV2,
    Permissions,
    UpdateChallengeRouteV2,
    type AdminChallenge,
  } from '@rctf/types'
  import { useQueryClient } from '@tanstack/svelte-query'
  import { onMount } from 'svelte'
  import { apiRequest, showApiError } from '$lib/api'
  import { useAdminChallenge, useAdminChallenges } from '$lib/query/admin'
  import { queryKeys } from '$lib/query/keys'
  import { toast } from '$lib/toast'
  import Dialog from '$lib/ui/dialog.svelte'
  import Splitter from '$lib/ui/splitter.svelte'
  import { handlePaneArrowKey } from '$lib/utils/pane-keynav'
  import AdminChallengesDetails from './details/details.svelte'
  import AdminChallengesList from './list/list.svelte'
  import {
    create,
    createEditorState,
    detailLoaded,
    select,
    type EditorState,
  } from './model/editor-state'

  const DESKTOP_MIN_WIDTH = 768
  const WIDE_MIN_WIDTH = 1280

  const queryClient = useQueryClient()
  const challengesQuery = useAdminChallenges()
  const challenges = $derived(challengesQuery.data ?? [])

  let editor = $state<EditorState>(createEditorState())
  let selectedIds = $state<Set<string>>(new Set())

  const selectedId = $derived(editor.challenge?.id ?? null)
  const isCreating = $derived(editor.mode === 'creating')

  const detailQuery = useAdminChallenge(() => selectedId)
  $effect(() => {
    const detail = detailQuery.data
    if (detail) {
      editor = detailLoaded(editor, detail)
    }
  })

  let innerWidth = $state(0)
  const isMobile = $derived(innerWidth > 0 && innerWidth < DESKTOP_MIN_WIDTH)
  const listMinSize = $derived(innerWidth < WIDE_MIN_WIDTH ? 40 : 20)

  

  

  

  

  

  

  onMount(() => {
    const id = requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'))
    })
    return () => cancelAnimationFrame(id)
  })

  const drawerTitle = $derived(
    isCreating
      ? 'New challenge'
      : (editor.challenge?.name ?? 'Challenge details')
  )

  let drawerDismissed = $state(false)
  const drawerOpen = $derived(
    isMobile && (selectedId !== null || isCreating) && !drawerDismissed
  )

  function handleSelect(challenge: AdminChallenge) {
    if (selectedId === challenge.id && editor.mode === 'viewing') {
      editor = select(editor, null)
      return
    }
    editor = select(editor, challenge)
    drawerDismissed = false
  }

  function handleCreateNew() {
    editor = create(editor)
    drawerDismissed = false
  }

  function toggleChallengeSelection(challenge: AdminChallenge) {
    const next = new Set(selectedIds)
    if (next.has(challenge.id)) {
      next.delete(challenge.id)
    } else {
      next.add(challenge.id)
    }
    selectedIds = next
  }

  function clearSelectedChallenges() {
    selectedIds = new Set()
  }

  function handleSelectAll(ids: string[]) {
    selectedIds = new Set(ids)
  }

  function handleToggleCollapseAll(collapsing: boolean) {
    if (collapsing) {
      editor = select(editor, null)
      drawerDismissed = true
    }
  }

  async function handleBulkHide() {
    const ids = [...selectedIds]
    if (ids.length === 0) return

    try {
      const responses = await Promise.all(
        ids.map(id =>
          apiRequest(UpdateChallengeRouteV2, {
            id,
            data: { hidden: true },
          })
        )
      )

      if (responses.some(response => response.kind !== GoodChallengeUpdateV2.kind)) {
        const invalid = responses.find(
          response => response.kind !== GoodChallengeUpdateV2.kind
        )
        if (invalid) {
          showApiError(invalid)
          return
        }
      }

      toast.success(`Hidden ${ids.length} challenge${ids.length === 1 ? '' : 's'}.`)
      queryClient.invalidateQueries({ queryKey: queryKeys.adminChallenges })
      clearSelectedChallenges()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to hide selected challenges'
      )
    }
  }

  async function handleBulkShow() {
    const ids = [...selectedIds]
    if (ids.length === 0) return

    try {
      const responses = await Promise.all(
        ids.map(id =>
          apiRequest(UpdateChallengeRouteV2, {
            id,
            data: { hidden: false },
          })
        )
      )

      if (responses.some(response => response.kind !== GoodChallengeUpdateV2.kind)) {
        const invalid = responses.find(
          response => response.kind !== GoodChallengeUpdateV2.kind
        )
        if (invalid) {
          showApiError(invalid)
          return
        }
      }

      toast.success(`Shown ${ids.length} challenge${ids.length === 1 ? '' : 's'}.`)
      queryClient.invalidateQueries({ queryKey: queryKeys.adminChallenges })
      clearSelectedChallenges()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to show selected challenges'
      )
    }
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds]
    if (ids.length === 0) return

    try {
      const responses = await Promise.all(
        ids.map(id => apiRequest(DeleteChallengeRoute, { id }))
      )

      if (responses.some(response => response.kind !== GoodChallengeDelete.kind)) {
        const invalid = responses.find(
          response => response.kind !== GoodChallengeDelete.kind
        )
        if (invalid) {
          showApiError(invalid)
          return
        }
      }

      toast.success(
        `Deleted ${ids.length} challenge${ids.length === 1 ? '' : 's'}.`
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.adminChallenges })
      clearSelectedChallenges()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete selected challenges'
      )
    }
  }

  function handleDrawerOpenChange(open: boolean) {
    if (!open) {
      drawerDismissed = true
    }
  }

  function handleEditorChange(next: EditorState) {
    editor = next
  }
</script>

<svelte:window bind:innerWidth />

{#snippet listPane()}
  <admin-list-slot>
    <AdminChallengesList
      {challenges}
      {selectedId}
      {selectedIds}
      isCreatingNew={isCreating}
      onSelect={handleSelect}
      onToggleSelect={toggleChallengeSelection}
      onSelectAll={handleSelectAll}
      onToggleCollapseAll={handleToggleCollapseAll}
      onCreateNew={handleCreateNew}
      onBulkHide={handleBulkHide}
      onBulkShow={handleBulkShow}
      onBulkDelete={handleBulkDelete}
      onClearSelection={clearSelectedChallenges}
    />
  </admin-list-slot>
{/snippet}

{#snippet detailPane()}
  <admin-detail-slot>
    <AdminChallengesDetails {editor} onEditorChange={handleEditorChange} />
  </admin-detail-slot>
{/snippet}

{#if isMobile}
  <admin-challenges-page data-form="mobile">
    <pane-surface data-side="list">{@render listPane()}</pane-surface>
    <Dialog
      open={drawerOpen}
      onOpenChange={handleDrawerOpenChange}
      title={drawerTitle}
      titleHidden
      presentation="drawer"
      flush
    >
      <drawer-body tabindex="-1">{@render detailPane()}</drawer-body>
    </Dialog>
  </admin-challenges-page>
{:else}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <admin-challenges-page data-form="desktop" onkeydown={handlePaneArrowKey}>
    {#if selectedId !== null || isCreating}
      <Splitter
        panels={[
          { id: 'list', minSize: listMinSize, maxSize: 50 },
          { id: 'detail', minSize: 40 },
        ]}
        defaultSize={[40, 60]}
      >
        {#snippet a()}
          <pane-surface data-side="list">{@render listPane()}</pane-surface>
        {/snippet}
        {#snippet b()}
          <pane-surface data-side="detail">{@render detailPane()}</pane-surface>
        {/snippet}
      </Splitter>
    {:else}
      <pane-surface data-side="list">{@render listPane()}</pane-surface>
    {/if}
  </admin-challenges-page>
{/if}

<style>
  admin-challenges-page {
    display: flex;
    flex: 1 1 auto;
    block-size: calc(100dvh - var(--header-height));
    max-block-size: calc(100dvh - var(--header-height));
    min-block-size: 0;
    inline-size: 100%;
    --splitter-handle-size: 0.5rem;

    &[data-form='mobile'] {
      flex-direction: column;

      pane-surface[data-side='list'] {
        flex: 1;
        min-block-size: 0;
        border-start-end-radius: 0;
      }
    }
  }

  pane-surface {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    block-size: 100%;
    min-block-size: 0;
    overflow: hidden;
    background: linear-gradient(
      135deg,
      color-mix(in oklab, rgba(63, 168, 179, 0.695) 50%, transparent),
      color-mix(in oklab, rgb(14, 14, 176) 38%, transparent)
    );
    border: 2px solid rgb(25, 168, 130);
    border-radius: var(--radius-1lg);
    font-family: 'Pixelify Sans', Verdana, sans-serif;
    font-size: 0.9rem;
    /* color: blue; */

    &[data-side='list'] {
      border-start-end-radius: var(--radius-3xl);
      border-end-end-radius: var(--radius-3xl);
    }

    &[data-side='detail'] {
      border-start-start-radius: var(--radius-3xl);
      border-end-start-radius: var(--radius-3xl);
    }
  }

  admin-list-slot,
  admin-detail-slot {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-block-size: 0;
  }

  drawer-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-block-size: 0;
    overflow: auto;
    overscroll-behavior: none;
  }

  :global([data-presentation='drawer']) {
    --dialog-drawer-max-size: 85dvh;
  }
</style>