<script lang="ts">
  import {
    GoodRegisterV2,
    GoodVerifySent,
    ProtectedAction,
    RegisterRouteV2,
  } from '@rctf/types'
  import { useQueryClient } from '@tanstack/svelte-query'
  import { setToken } from '$lib/api'
  import ArchivedNotice from '$lib/components/archived-notice.svelte'
  import CaptchaNotice from '$lib/components/captcha-notice.svelte'
  import { useApiForm } from '$lib/forms/use-api-form.svelte'
  import { useClientConfig } from '$lib/query/config'
  import { queryKeys } from '$lib/query/keys'
  import { toast } from '$lib/toast'
  import Button from '$lib/ui/button.svelte'
  import Card from '$lib/ui/card.svelte'
  import Field from '$lib/ui/field.svelte'
  import Input from '$lib/ui/input.svelte'
  import Spinner from '$lib/ui/spinner.svelte'

  const queryClient = useQueryClient()
  const configQuery = useClientConfig()
  const clientConfig = $derived(configQuery.data)

  let verifySent = $state(false)
  let registered = $state(false)

  const form = useApiForm(RegisterRouteV2, {
    onSuccess: response => {
      if (response.kind === GoodRegisterV2.kind) {
        handleRegisterSuccess(response.data.authToken)
      } else if (response.kind === GoodVerifySent.kind) {
        verifySent = true
      }
    },
  })

  const isPending = $derived(form.submitting)

  function handleRegisterSuccess(authToken: string) {
    setToken(authToken)
    registered = true
    toast.success('Account created successfully!')
    queryClient.invalidateQueries({ queryKey: queryKeys.userSelf })
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    form.submit()
  }
</script>

<svelte:head>
  {#if clientConfig}
    <title>Register | {clientConfig.ctfName}</title>
  {/if}
</svelte:head>

{#if clientConfig?.isArchived}
  <ArchivedNotice message="Registration is not available." />
{:else if clientConfig?.registrationsEnabled === false}
  <Card
    title="Registrations closed"
    description="New registrations are currently disabled"
  >
    <auth-page>
      <p>
        Registrations for {clientConfig.ctfName} are closed. If you believe this is
        a mistake, please contact the organizers.
      </p>
      <footer-note
        >Already have an account? <a href="/login">Login here</a>.</footer-note
      >
    </auth-page>
  </Card>
{:else if clientConfig}
  {#if registered}
    <Card title="Account created" description="You are now logged in.">
      <auth-page>
        <Button href="/">Continue</Button>
      </auth-page>
    </Card>
  {:else if verifySent}
    <Card
      title="Verification email sent"
      description="Check your inbox to complete registration"
    >
      <auth-page>
        <p>
          We've sent a verification email to <strong>{form.data.email}</strong>.
          Please check your inbox and click the link to complete registration.
          If you didn't receive the email, check your spam folder or
          <button type="button" onclick={() => (verifySent = false)}
            >try again</button
          >.
        </p>
      </auth-page>
    </Card>
  {:else}
    <Card
      title="Register"
      description="Create an account for {clientConfig.ctfName}"
    >
      <auth-page>
        <p>Please register only one account per person.</p>
        {#if form.errors._form}
          <p role="alert">{form.errors._form}</p>
        {/if}
        <form onsubmit={handleSubmit}>
          <Field label="Username" error={form.errors.name}>
            {#snippet children({ id, describedBy })}
              <Input
                {id}
                name="name"
                type="text"
                placeholder="Enter your username"
                autocomplete="username"
                autocorrect="off"
                minlength={2}
                maxlength={64}
                required
                aria-describedby={describedBy}
                aria-invalid={!!form.errors.name || undefined}
                bind:value={form.data.name}
                oninput={() => form.validateField('name')}
              />
            {/snippet}
          </Field>
          <Field label="Email" error={form.errors.email}>
            {#snippet children({ id, describedBy })}
              <Input
                {id}
                name="email"
                type="email"
                placeholder="Enter your email"
                autocomplete="email"
                required
                aria-describedby={describedBy}
                aria-invalid={!!form.errors.email || undefined}
                bind:value={form.data.email}
                oninput={() => form.validateField('email')}
              />
            {/snippet}
          </Field>
          <Field label="Password" error={form.errors.password}>
            {#snippet children({ id, describedBy })}
              <Input
                {id}
                name="password"
                type="password"
                placeholder="Enter your password"
                autocomplete="new-password"
                required
                aria-describedby={describedBy}
                aria-invalid={!!form.errors.password || undefined}
                bind:value={form.data.password}
                oninput={() => form.validateField('password')}
              />
            {/snippet}
          </Field>
          <Button type="submit" disabled={isPending}>
            {#if isPending}
              <Spinner />
            {/if}
            Register
          </Button>
        </form>
        <footer-note
          >Already have an account? <a href="/login">Login here</a
          >.</footer-note
        >
        <CaptchaNotice
          config={clientConfig}
          action={ProtectedAction.Register}
        />
      </auth-page>
    </Card>
  {/if}
{/if}
