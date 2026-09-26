import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2, RefreshCw, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { adminService } from '../../services/adminService'

export default function AdminOrganizations() {
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionId, setActionId] = useState(null)

  const loadOrganizations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminService.getOrganizations()
      setOrganizations(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load organization requests.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  const pending = useMemo(
    () => organizations.filter((organization) => !organization.is_verified),
    [organizations],
  )

  const approved = useMemo(
    () => organizations.filter((organization) => organization.is_verified),
    [organizations],
  )

  const approve = async (id) => {
    setActionId(id)
    try {
      await adminService.approveOrganization(id, 'Approved by platform administrator')
      await loadOrganizations()
    } catch (err) {
      setError(err.message || 'Unable to approve organization.')
    } finally {
      setActionId(null)
    }
  }

  const reject = async (id) => {
    const reason = window.prompt('Reason for rejection (optional):', '') ?? ''
    setActionId(id)
    try {
      await adminService.rejectOrganization(id, reason)
      await loadOrganizations()
    } catch (err) {
      setError(err.message || 'Unable to reject organization.')
    } finally {
      setActionId(null)
    }
  }

  const renderOrganization = (organization) => (
    <Card key={organization.id}>
      <div className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-ink">{organization.name}</h3>
              <Badge tone={organization.is_verified ? 'success' : 'warning'}>
                {organization.is_verified ? 'APPROVED' : 'PENDING'}
              </Badge>
            </div>
            <p className="text-sm text-ink-soft mt-1">{organization.email}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-ink-soft">
              <span>Type: <strong className="text-ink">{organization.role === 'KITCHEN' ? 'Institutional Kitchen' : 'Social Welfare Organization'}</strong></span>
              <span>Role: <strong className="text-ink">{organization.role}</strong></span>
              {organization.phone && <span>Phone: <strong className="text-ink">{organization.phone}</strong></span>}
            </div>
            {organization.address && (
              <p className="text-xs text-ink-soft mt-2">Address: {organization.address}</p>
            )}
            {organization.notes && (
              <p className="text-xs text-ink-soft mt-2">Verification details: {organization.notes}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              size="sm"
              variant="primary"
              loading={actionId === organization.id}
              disabled={organization.is_verified}
              onClick={() => approve(organization.id)}
            >
              <CheckCircle2 size={15} /> Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={actionId === organization.id}
              disabled={organization.is_verified}
              onClick={() => reject(organization.id)}
            >
              <XCircle size={15} /> Reject
            </Button>
            <Button
              as={Link}
              to={`/admin/organizations/${organization.id}`}
              size="sm"
              variant="secondary"
            >
              View details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )

  return (
    <DashboardLayout role="ADMIN" title="Organizations">
      <PageHeader
        title="Organization requests"
        description="   "
        action={(
          <Button variant="secondary" size="sm" onClick={loadOrganizations} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </Button>
        )}
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-sm bg-gold-50 text-gold-600 flex items-center justify-center"><Clock size={18} /></div>
            <div><p className="text-xs text-ink-soft">Pending requests</p><p className="text-xl font-semibold text-ink">{pending.length}</p></div>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-sm bg-brand-50 text-brand-600 flex items-center justify-center"><CheckCircle2 size={18} /></div>
            <div><p className="text-xs text-ink-soft">Approved</p><p className="text-xl font-semibold text-ink">{approved.length}</p></div>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-sm bg-paper-sunken text-ink-soft flex items-center justify-center"><Building2 size={18} /></div>
            <div><p className="text-xs text-ink-soft">Total organizations</p><p className="text-xl font-semibold text-ink">{organizations.length}</p></div>
          </div>
        </Card>
      </div>

      {error && <div className="mb-5"><ErrorState title="Could not load organization requests" message={error} onRetry={loadOrganizations} /></div>}

      {loading ? (
        <LoadingState label="Loading organization requests…" />
      ) : organizations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organization registrations yet"
          message="When an NGO, orphanage, or institutional kitchen submits registration, it will appear here."
        />
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-ink mb-3">Pending review ({pending.length})</h2>
              <div className="space-y-3">{pending.map(renderOrganization)}</div>
            </section>
          )}
          {approved.length > 0 && (
            <section className="mt-7">
              <h2 className="text-sm font-semibold text-ink mb-3">Approved organizations ({approved.length})</h2>
              <div className="space-y-3">{approved.map(renderOrganization)}</div>
            </section>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
