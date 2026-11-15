<script lang="ts">
  import { LoginRoute } from '@rctf/types'
  import { useQueryClient } from '@tanstack/svelte-query'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { setToken } from '$lib/api'
  import ArchivedNotice from '$lib/components/archived-notice.svelte'
  import { useApiForm } from '$lib/forms/use-api-form.svelte'
  import { useClientConfig } from '$lib/query/config'
  import { queryKeys } from '$lib/query/keys'
  import { toast } from '$lib/toast'
  import Button from '$lib/ui/button.svelte'
  import Card from '$lib/ui/card.svelte'
  import Field from '$lib/ui/field.svelte'
  import Input from '$lib/ui/input.svelte'
  import Spinner from '$lib/ui/spinner.svelte'
  import { getRedirectPath } from '$lib/utils/redirect'

  const queryClient = useQueryClient()
  const configQuery = useClientConfig()
  const clientConfig = $derived(configQuery.data)

  const form = useApiForm(LoginRoute, {
    onSuccess: response => handleLoginSuccess(response.data.authToken),
  })

  const isPending = $derived(form.submitting)

  function handleLoginSuccess(authToken: string) {
    setToken(authToken)
    toast.success('Logged in successfully!')
    queryClient.invalidateQueries({ queryKey: queryKeys.userSelf })
    goto(getRedirectPath(page.url.searchParams.get('next'), page.url.origin))
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    form.submit()
  }
</script>

<svelte:head>
  {#if clientConfig}
    <title>Login | {clientConfig.ctfName}</title>
  {/if}
</svelte:head>

{#if clientConfig?.isArchived}
  <ArchivedNotice message="Authentication is not available." />
{:else if clientConfig}
  <Card title="Login" description="Log in to {clientConfig.ctfName}">
    <auth-page>
      <form onsubmit={handleSubmit}>
        <Field
          label="Username"
          error={form.errors.username ?? form.errors._form}
        >
          {#snippet children({ id, describedBy })}
            <Input
              {id}
              name="username"
              type="text"
              placeholder="Enter your username"
              autocomplete="username"
              required
              aria-describedby={describedBy}
              aria-invalid={!!form.errors.username ||
                !!form.errors._form ||
                undefined}
              bind:value={form.data.username}
              oninput={() => form.validateField('username')}
            />
          {/snippet}
        </Field>
        <Field
          label="Password"
          error={form.errors.password ?? form.errors._form}
        >
          {#snippet children({ id, describedBy })}
            <Input
              {id}
              name="password"
              type="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
              aria-describedby={describedBy}
              aria-invalid={!!form.errors.password ||
                !!form.errors._form ||
                undefined}
              bind:value={form.data.password}
              oninput={() => form.validateField('password')}
            />
          {/snippet}
        </Field>
        {#if clientConfig.emailEnabled}
          <p><a href="/recover">Lost your password?</a></p>
        {/if}
        <Button type="submit" disabled={isPending}>
          {#if isPending}
            <Spinner />
          {/if}
          Login
        </Button>
      </form>
      {#if clientConfig.registrationsEnabled !== false}
        <footer-note
          >  Don't have an account? <a href="/register">Register here</a
          >.</footer-note
        >
      {/if}
    </auth-page>
  </Card>
{/if}

<style>
  footer-note {
    display: block;
    margin-top: 1rem;
    color: #94a3b8;
    font-size: 0.875rem;
  }

  footer-note a {
    color: #38bdf8;
    font-weight: 500;
    text-decoration: none;
  }

  footer-note a:hover {
    color: #7dd3fc;
    text-decoration: underline;
  }
</style>