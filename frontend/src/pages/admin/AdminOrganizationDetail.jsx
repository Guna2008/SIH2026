import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { adminService } from '../../services/adminService'
import LocationMap from '../../components/shared/LocationMap'

export default function AdminOrganizationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [action, setAction] = useState(null)

  const loadOrganization = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminService.getOrganization(id)
      setOrganization(data)
    } catch (err) {
      setError(err.message || 'Unable to load organization.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadOrganization()
  }, [loadOrganization])

  const approve = async () => {
    setAction('approve')
    try {
      await adminService.approveOrganization(id, 'Approved by platform administrator')
      await loadOrganization()
    } catch (err) {
      setError(err.message || 'Unable to approve organization.')
    } finally {
      setAction(null)
    }
  }

  const reject = async () => {
    const reason = window.prompt('Reason for rejection (optional):', '') ?? ''
    setAction('reject')
    try {
      await adminService.rejectOrganization(id, reason)
      await loadOrganization()
    } catch (err) {
      setError(err.message || 'Unable to reject organization.')
    } finally {
      setAction(null)
    }
  }

  if (loading) {
    return <DashboardLayout role="ADMIN" title="Organization detail"><LoadingState label="Loading organization…" /></DashboardLayout>
  }

  if (error || !organization) {
    return (
      <DashboardLayout role="ADMIN" title="Organization detail">
        <ErrorState title="Organization could not be loaded" message={error || 'Organization not found.'} onRetry={loadOrganization} />
      </DashboardLayout>
    )
  }

  const isPending = !organization.is_verified

  return (
    <DashboardLayout role="ADMIN" title="Organization detail">
      <Link to="/admin/organizations" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink mb-4">
        <ArrowLeft size={14} /> Back to organizations
      </Link>
      <PageHeader
        title={organization.name}
        description={`${organization.role === 'KITCHEN' ? 'Institutional Kitchen' : 'Social Welfare Organization'} · ${organization.email}`}
      />

      {error && <div className="mb-5"><ErrorState message={error} onRetry={loadOrganization} /></div>}

      <Card className="max-w-3xl">
        <div className="p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-xs text-ink-soft uppercase tracking-wide">Verification status</p>
              <div className="mt-1"><Badge tone={isPending ? 'warning' : 'success'}>{isPending ? 'PENDING' : 'APPROVED'}</Badge></div>
            </div>
            {isPending && (
              <div className="flex gap-2">
                <Button variant="primary" loading={action === 'approve'} disabled={Boolean(action)} onClick={approve}>
                  <CheckCircle2 size={15} /> Approve
                </Button>
                <Button variant="danger" loading={action === 'reject'} disabled={Boolean(action)} onClick={reject}>
                  <XCircle size={15} /> Reject
                </Button>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-ink-soft">Organization name</p><p className="mt-1 font-medium text-ink">{organization.name}</p></div>
            <div><p className="text-xs text-ink-soft">Role</p><p className="mt-1 font-medium text-ink">{organization.role}</p></div>
            <div><p className="text-xs text-ink-soft">Email</p><p className="mt-1 text-ink">{organization.email}</p></div>
            <div><p className="text-xs text-ink-soft">Phone</p><p className="mt-1 text-ink">{organization.phone || '—'}</p></div>
            <div className="sm:col-span-2"><p className="text-xs text-ink-soft">Address</p><p className="mt-1 text-ink">{organization.address || '—'}</p></div>
            <div><p className="text-xs text-ink-soft">Beneficiary capacity</p><p className="mt-1 text-ink">{organization.capacity ?? '—'}</p></div>
            <div><p className="text-xs text-ink-soft">Registered</p><p className="mt-1 text-ink">{new Date(organization.created_at).toLocaleString()}</p></div>
            <div className="sm:col-span-2"><p className="text-xs text-ink-soft">Verification details</p><p className="mt-1 text-ink whitespace-pre-wrap">{organization.notes || '—'}</p></div>
          </div>

          {organization.latitude != null && organization.longitude != null && (
            <LocationMap latitude={organization.latitude} longitude={organization.longitude} title="Organization location" />
          )}
        </div>
      </Card>

      <div className="mt-5">
        <Button variant="secondary" onClick={() => navigate('/admin/organizations')}>Back to requests</Button>
      </div>
    </DashboardLayout>
  )
}
