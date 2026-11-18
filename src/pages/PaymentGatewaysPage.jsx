import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../utils/api'

const PROVIDER_META = {
  paymongo: {
    label: 'PayMongo',
    publicKeyLabel: 'Public Key',
    secretKeyLabel: 'Secret Key',
    needsApi: false,
    hint: 'Use test keys (pk_test_ / sk_test_) for sandbox, or live keys for production.',
  },
  paypal: {
    label: 'PayPal',
    publicKeyLabel: 'Client ID',
    secretKeyLabel: 'Client Secret',
    needsApi: false,
    hint: 'Create an app in the PayPal Developer Dashboard. Sandbox and live use different Client IDs.',
  },
  paynamics: {
    label: 'Paynamics',
    publicKeyLabel: 'Merchant ID',
    secretKeyLabel: 'Merchant Key',
    needsApi: true,
    hint: 'Include your Paynamics API username and password for the hosted payment request.',
  },
}

const emptyForm = {
  provider: 'paymongo',
  name: 'PayMongo',
  environment: 'testing',
  publicKey: '',
  secretKey: '',
  apiUsername: '',
  apiPassword: '',
  activate: true,
}

function StatusBadge({ status }) {
  const online = status === 'active'
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
        online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {online ? 'Online' : 'Offline'}
    </span>
  )
}

function EnvironmentBadge({ environment }) {
  const live = environment === 'production'
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
        live ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-700'
      }`}
    >
      {live ? 'Production' : 'Testing'}
    </span>
  )
}

function ProviderChip({ provider }) {
  const label = PROVIDER_META[provider]?.label ?? provider
  return (
    <span className="inline-flex items-center rounded-md bg-[#E8F0FE] px-2 py-0.5 text-[11px] font-bold text-[#2B5AED]">
      {label}
    </span>
  )
}

function GatewayFormModal({ open, gateway, providers, onClose, onSubmit, saving, error }) {
  const isEdit = Boolean(gateway)
  const [form, setForm] = useState(emptyForm)
  const [showSecret, setShowSecret] = useState(false)
  const [showApiPassword, setShowApiPassword] = useState(false)
  const [nameEdited, setNameEdited] = useState(false)

  useEffect(() => {
    if (!open) return
    if (gateway) {
      setForm({
        provider: gateway.provider,
        name: gateway.name || '',
        environment: gateway.environment || 'testing',
        publicKey: '',
        secretKey: '',
        apiUsername: '',
        apiPassword: '',
        activate: gateway.status === 'active',
      })
      setNameEdited(true)
    } else {
      setForm(emptyForm)
      setNameEdited(false)
    }
    setShowSecret(false)
    setShowApiPassword(false)
  }, [open, gateway])

  if (!open) return null

  const providerOptions =
    Array.isArray(providers) && providers.length > 0
      ? providers
      : Object.entries(PROVIDER_META).map(([id, meta]) => ({
          id,
          label: meta.label,
          publicKeyLabel: meta.publicKeyLabel,
          secretKeyLabel: meta.secretKeyLabel,
          requiresApiCredentials: meta.needsApi,
        }))

  const selectedMeta = PROVIDER_META[form.provider] || PROVIDER_META.paymongo
  const needsApi = selectedMeta.needsApi

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({
            ...form,
            name: form.name.trim(),
            publicKey: form.publicKey.trim(),
            secretKey: form.secretKey.trim(),
            apiUsername: form.apiUsername.trim(),
            apiPassword: form.apiPassword.trim(),
          })
        }}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#0f3f73]">{isEdit ? 'Edit payment gateway' : 'Add payment gateway'}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Credentials are encrypted. Only one gateway can be online for direct website checkout.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-xl font-bold text-slate-500" aria-label="Close">
            ×
          </button>
        </div>

        {error ? (
          <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
        ) : null}

        <div className="space-y-3">
          {!isEdit ? (
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">Provider</span>
              <select
                value={form.provider}
                onChange={(event) => {
                  const provider = event.target.value
                  setForm((prev) => ({
                    ...prev,
                    provider,
                    name: nameEdited ? prev.name : PROVIDER_META[provider]?.label || provider,
                  }))
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                {providerOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-[#f6f9ff] px-3 py-2 text-sm">
              <span className="font-semibold text-slate-700">Provider: </span>
              <ProviderChip provider={form.provider} />
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-800">Display name</span>
            <input
              required
              value={form.name}
              onChange={(event) => {
                setNameEdited(true)
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          {form.provider !== 'paymongo' ? (
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">Environment</span>
              <select
                value={form.environment}
                onChange={(event) => setForm((prev) => ({ ...prev, environment: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="testing">Testing / Sandbox</option>
                <option value="production">Production</option>
              </select>
            </label>
          ) : (
            <p className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-900">{selectedMeta.hint}</p>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-800">
              {selectedMeta.publicKeyLabel}
              {isEdit ? ' (leave blank to keep)' : ''}
            </span>
            <input
              required={!isEdit}
              value={form.publicKey}
              onChange={(event) => setForm((prev) => ({ ...prev, publicKey: event.target.value }))}
              placeholder={isEdit ? gateway?.publicKeyMasked || '••••' : ''}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-800">
              {selectedMeta.secretKeyLabel}
              {isEdit ? ' (leave blank to keep)' : ''}
            </span>
            <div className="relative">
              <input
                required={!isEdit}
                type={showSecret ? 'text' : 'password'}
                value={form.secretKey}
                onChange={(event) => setForm((prev) => ({ ...prev, secretKey: event.target.value }))}
                placeholder={isEdit ? gateway?.secretKeyMasked || '••••' : ''}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-16 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#2B5AED]"
              >
                {showSecret ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {needsApi ? (
            <>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-800">
                  API Username{isEdit ? ' (leave blank to keep)' : ''}
                </span>
                <input
                  required={!isEdit}
                  value={form.apiUsername}
                  onChange={(event) => setForm((prev) => ({ ...prev, apiUsername: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-800">
                  API Password{isEdit ? ' (leave blank to keep)' : ''}
                </span>
                <div className="relative">
                  <input
                    required={!isEdit}
                    type={showApiPassword ? 'text' : 'password'}
                    value={form.apiPassword}
                    onChange={(event) => setForm((prev) => ({ ...prev, apiPassword: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-16 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#2B5AED]"
                  >
                    {showApiPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>
            </>
          ) : null}

          {!isEdit ? (
            <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-[#f6f9ff] px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={form.activate}
                onChange={(event) => setForm((prev) => ({ ...prev, activate: event.target.checked }))}
                className="mt-0.5"
              />
              <span>
                <span className="font-semibold text-slate-800">Set as online gateway</span>
                <span className="mt-0.5 block text-xs text-slate-600">
                  Guests on your direct website will check out with this provider. Any other online gateway becomes
                  offline.
                </span>
              </span>
            </label>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#2B5AED] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add gateway'}
          </button>
        </div>
      </form>
    </div>
  )
}

function PaymentGatewaysPage() {
  const [gateways, setGateways] = useState([])
  const [providers, setProviders] = useState([])
  const [activeGatewayId, setActiveGatewayId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch('/v1/payment-gateways')
      setGateways(Array.isArray(data?.gateways) ? data.gateways : [])
      setProviders(Array.isArray(data?.providers) ? data.providers : [])
      setActiveGatewayId(data?.activeGatewayId ?? null)
    } catch (requestError) {
      setError(requestError?.message || 'Could not load payment gateways.')
      setGateways([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onlineGateway = useMemo(
    () => gateways.find((row) => row.id === activeGatewayId) || gateways.find((row) => row.isOnline) || null,
    [gateways, activeGatewayId],
  )

  async function handleSave(form) {
    setSaving(true)
    setFormError('')
    try {
      if (editTarget) {
        const body = { name: form.name, environment: form.environment }
        if (form.publicKey) body.publicKey = form.publicKey
        if (form.secretKey) body.secretKey = form.secretKey
        if (form.apiUsername) body.apiUsername = form.apiUsername
        if (form.apiPassword) body.apiPassword = form.apiPassword
        await apiFetch(`/v1/payment-gateways/${editTarget.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
        setNotice('Payment gateway updated.')
      } else {
        await apiFetch('/v1/payment-gateways', {
          method: 'POST',
          body: JSON.stringify(form),
        })
        setNotice(form.activate ? 'Payment gateway added and set online.' : 'Payment gateway added.')
      }
      setFormOpen(false)
      setEditTarget(null)
      await load()
    } catch (requestError) {
      setFormError(requestError?.message || 'Could not save payment gateway.')
    } finally {
      setSaving(false)
    }
  }

  async function activate(id) {
    setBusyId(id)
    setError('')
    try {
      await apiFetch(`/v1/payment-gateways/${id}/activate`, { method: 'POST' })
      setNotice('This gateway is now online for direct website checkout.')
      await load()
    } catch (requestError) {
      setError(requestError?.message || 'Could not activate gateway.')
    } finally {
      setBusyId(null)
    }
  }

  async function deactivate(id) {
    setBusyId(id)
    setError('')
    try {
      await apiFetch(`/v1/payment-gateways/${id}/deactivate`, { method: 'POST' })
      setNotice('Payment gateway set to offline.')
      await load()
    } catch (requestError) {
      setError(requestError?.message || 'Could not deactivate gateway.')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id) {
    if (!window.confirm('Remove this payment gateway? Guests will no longer be able to pay with it.')) return
    setBusyId(id)
    setError('')
    try {
      await apiFetch(`/v1/payment-gateways/${id}`, { method: 'DELETE' })
      setNotice('Payment gateway removed.')
      await load()
    } catch (requestError) {
      setError(requestError?.message || 'Could not remove gateway.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0f3f73]">Payment Gateway</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Connect PayMongo, PayPal, or Paynamics for your direct website. Add multiple gateways, but only one can be
            online — that gateway handles guest booking checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditTarget(null)
            setFormError('')
            setFormOpen(true)
          }}
          className="inline-flex items-center justify-center rounded-xl bg-[#2B5AED] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95"
        >
          + Add gateway
        </button>
      </div>

      {notice ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
      ) : null}

      <div className="mb-5 rounded-2xl border border-[#d7e4f7] bg-[#f6f9ff] px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0f3f73]">Online for checkout</p>
        {onlineGateway ? (
          <p className="mt-1 text-sm text-slate-700">
            <span className="font-bold text-[#0f3f73]">{onlineGateway.name}</span>
            <span className="mx-2 text-slate-400">·</span>
            <ProviderChip provider={onlineGateway.provider} />
            <span className="ml-2 inline-block align-middle">
              <EnvironmentBadge environment={onlineGateway.environment} />
            </span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-600">
            No gateway is online. Guests can still request a booking, but they will not be redirected to pay online.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Gateway</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Environment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Keys</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Loading payment gateways…
                  </td>
                </tr>
              ) : null}
              {!loading && gateways.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No payment gateways yet. Add PayMongo, PayPal, or Paynamics to start collecting online payments.
                  </td>
                </tr>
              ) : null}
              {gateways.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Updated{' '}
                      {row.updatedAt
                        ? new Date(row.updatedAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <ProviderChip provider={row.provider} />
                  </td>
                  <td className="px-4 py-3">
                    <EnvironmentBadge environment={row.environment} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <code className="block max-w-[180px] truncate rounded bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                      {row.publicKeyMasked || '—'}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {row.status === 'active' ? (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => deactivate(row.id)}
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Set offline
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => activate(row.id)}
                          className="rounded-md border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                        >
                          Set online
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditTarget(row)
                          setFormError('')
                          setFormOpen(true)
                        }}
                        className="rounded-md border border-[#c9d8f5] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2B5AED] hover:bg-[#E8F0FE]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => remove(row.id)}
                        className="rounded-md border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <GatewayFormModal
        open={formOpen}
        gateway={editTarget}
        providers={providers}
        saving={saving}
        error={formError}
        onClose={() => {
          if (saving) return
          setFormOpen(false)
          setEditTarget(null)
          setFormError('')
        }}
        onSubmit={handleSave}
      />
    </div>
  )
}

export default PaymentGatewaysPage
