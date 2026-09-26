import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Card, { CardBody } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import Badge from '../../components/ui/Badge'
import { orphanageService } from '../../services/orphanageService'
import { useAuth } from '../../context/AuthContext'

export default function OrphanageProfile() {
  const { user: authUser, setUser: setAuthUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    max_distance_km: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    try {
      setError('')
      const u = await orphanageService.getProfile()
      setProfile(u)
      setForm({
        name: u.name || '',
        phone: u.phone || '',
        address: u.address || '',
        latitude: u.latitude ?? '',
        longitude: u.longitude ?? '',
        max_distance_km: u.max_distance_km ?? '30',
      })
    } catch (e) {
      setError(e.message || 'Could not load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        max_distance_km: form.max_distance_km === '' ? 30 : Number(form.max_distance_km),
      }
      const updated = await orphanageService.updateProfile(payload)
      setProfile(updated)
      if (setAuthUser) {
        setAuthUser(prev => ({ ...prev, ...updated }))
      }
      setSuccess('Profile updated successfully! Location and radius are active for matching surplus.')
    } catch (e) {
      setError(e.message || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="ORPHANAGE" title="Profile">
        <LoadingState label="Loading orphanage profile…" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ORPHANAGE" title="Profile">
      <PageHeader
        title="Orphanage Organization Profile"
        description="Maintain your orphanage contact details and dispatch location. Surplus food is matched to you based on your coordinates and collection radius."
      />

      {error && <ErrorState message={error} onRetry={load} />}

      {success && (
        <div className="mb-5 p-4 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          {success}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 max-w-5xl">
        <div className="lg:col-span-2">
          <Card>
            <CardBody>
              <form onSubmit={save} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Email address" value={profile?.email || authUser?.email || ''} disabled />
                  <div>
                    <label className="text-xs text-ink-soft mb-1 block">Account status</label>
                    <div className="h-10 flex items-center">
                      <Badge variant={profile?.is_verified ? 'success' : 'warning'}>
                        {profile?.is_verified ? 'Verified & Active' : 'Pending Admin Verification'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Input
                  label="Orphanage / Home name"
                  required
                  placeholder="e.g. Hope Children Home"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone number"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <Input
                    label="Max collection radius (km)"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="30"
                    value={form.max_distance_km}
                    onChange={(e) => setForm({ ...form, max_distance_km: e.target.value })}
                  />
                </div>

                <Input
                  label="Street address"
                  placeholder="e.g. 14 Gandhi Road, Coimbatore"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />

                <div className="pt-2 border-t border-line">
                  <p className="text-xs text-ink-soft mb-3">
                    GPS Coordinates
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Latitude"
                      type="number"
                      step="any"
                      placeholder="11.0168"
                      value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    />
                    <Input
                      label="Longitude"
                      type="number"
                      step="any"
                      placeholder="76.9558"
                      value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={load} disabled={saving}>
                    Discard changes
                  </Button>
                  <Button type="submit" loading={saving}>
                    Save profile
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
