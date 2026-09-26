import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Clock, CheckCircle2, Soup, Salad, HandHeart, Sprout, Trash2,
  ArrowRight, ShieldCheck, Check, X,
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/shared/StatCard'
import Card, { CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { adminService } from '../../services/adminService'
import { formatDateTime } from '../../lib/format'

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [processingId, setProcessingId] = useState(null)

  const load = useCallback(async () => {
    try {
      setError('')
      const [analyticsData, orgsData] = await Promise.all([
        adminService.getAnalytics(),
        adminService.getOrganizations().catch(() => []),
      ])
      setAnalytics(analyticsData)
      setOrganizations(Array.isArray(orgsData) ? orgsData : [])
    } catch (e) {
      setError(e.message || 'Could not load admin dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleApprove = async (id, name) => {
    setProcessingId(id)
    setError('')
    setActionSuccess('')
    try {
      await adminService.approveOrganization(id, 'Admin verified credentials and operational license')
      setActionSuccess(`Approved ${name || 'organization'} successfully!`)
      await load()
    } catch (e) {
      setError(e.message || 'Failed to approve organization')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id, name) => {
    setProcessingId(id)
    setError('')
    setActionSuccess('')
    try {
      await adminService.rejectOrganization(id, 'Verification requirements not satisfied')
      setActionSuccess(`Rejected ${name || 'organization'}.`)
      await load()
    } catch (e) {
      setError(e.message || 'Failed to reject organization')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="ADMIN" title="Dashboard">
        <LoadingState label="Loading platform oversight metrics…" />
      </DashboardLayout>
    )
  }

  const pendingOrgs = organizations.filter(o => !o.is_verified)

  return (
    <DashboardLayout role="ADMIN" title="Dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Platform Administration & Oversight</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/organizations">
            <Button className="flex items-center gap-2">
              <Building2 size={16} /> Manage Organizations
            </Button>
          </Link>
          <Link to="/admin/reports">
            <Button variant="secondary" className="flex items-center gap-2">
              <Sprout size={16} /> Export Reports
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {actionSuccess && (
        <div className="mb-5 p-4 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Organizations"
          value={analytics?.total_organizations ?? 0}
          icon={Building2}
          accent="#16834A"
          hint="  "
        />
        <StatCard
          label="Pending Verification"
          value={analytics?.pending_verification ?? 0}
          icon={Clock}
          accent="#D98D19"
          hint="   "
        />
        <StatCard
          label="Approved Organizations"
          value={analytics?.approved_organizations ?? 0}
          icon={CheckCircle2}
          accent="#16834A"
          hint="    "
        />
        <StatCard
          label="Institutional Kitchens"
          value={analytics?.kitchens ?? 0}
          icon={Soup}
          accent="#16834A"
          hint="   "
        />
        <StatCard
          label="Total Food Listings"
          value={analytics?.food_listings ?? 0}
          icon={Salad}
          accent="#D98D19"
          hint="    "
        />
        <StatCard
          label="Total Claims"
          value={analytics?.claims ?? 0}
          icon={HandHeart}
          accent="#16834A"
          hint="    "
        />
        <StatCard
          label="Redistributed Volume"
          value={`${analytics?.meals_redistributed ?? 0} servings`}
          icon={Sprout}
          accent="#16834A"
          hint="    "
        />
        <StatCard
          label="Redistribution Efficiency"
          value={analytics?.waste_reduction ?? '0%'}
          icon={Trash2}
          accent="#8B5CF6"
          hint="     "
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending Verification Queue */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-semibold text-ink flex items-center gap-2">
              <Clock size={18} className="text-amber-600" />
              Organizations Awaiting Verification ({pendingOrgs.length})
            </h3>
            <Link to="/admin/organizations" className="text-xs text-brand-700 hover:underline flex items-center gap-1 font-medium">
              View all directory <ArrowRight size={14} />
            </Link>
          </div>

          {pendingOrgs.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-8">
                  <ShieldCheck size={32} className="mx-auto mb-2 text-emerald-600" />
                  <p className="font-medium text-sm">All organizations are reviewed and up to date</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingOrgs.map((org) => (
                <Card key={org.id} className="border-amber-200 bg-amber-50/10">
                  <CardBody>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-semibold text-base">{org.name || 'Unnamed Org'}</h4>
                          <Badge variant="warning">{org.role}</Badge>
                        </div>
                        <p className="text-xs text-ink-soft mt-1">
                          {org.email} · {org.phone || 'No phone'}
                        </p>
                        {org.address && (
                          <p className="text-xs text-ink-soft mt-0.5">
                            {org.address}
                          </p>
                        )}
                        <p className="text-xs text-ink-soft mt-1">
                          Registered {formatDateTime(org.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={processingId === org.id}
                          onClick={() => handleReject(org.id, org.name)}
                          className="text-red-700 hover:bg-red-50 flex items-center gap-1"
                        >
                          <X size={14} /> Reject
                        </Button>
                        <Button
                          size="sm"
                          loading={processingId === org.id}
                          onClick={() => handleApprove(org.id, org.name)}
                          className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1"
                        >
                          <Check size={14} /> Approve
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links & Ecosystem Roles */}
        <div className="space-y-4">
          <Card>
            <CardBody>
              <h4 className="font-display text-sm font-semibold mb-3">Redistribution Ecosystem Breakdown</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded bg-paper-sunken">
                  <span>Social Welfare NGOs</span>
                  <span className="font-semibold text-ink">{analytics?.ngos ?? 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-paper-sunken">
                  <span>Orphanages & Shelters</span>
                  <span className="font-semibold text-ink">{analytics?.orphanages ?? 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-paper-sunken">
                  <span>Food Banks</span>
                  <span className="font-semibold text-ink">{analytics?.food_banks ?? 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-paper-sunken">
                  <span>Biogas Plants</span>
                  <span className="font-semibold text-ink">{analytics?.biogas_plants ?? 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-paper-sunken">
                  <span>Institutional Kitchens</span>
                  <span className="font-semibold text-ink">{analytics?.kitchens ?? 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-paper-sunken">
                  <span>Individual Donors</span>
                  <span className="font-semibold text-ink">{analytics?.individuals ?? 0}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h4 className="font-display text-sm font-semibold mb-2">Administrative Navigation</h4>
              <div className="space-y-2 text-xs">
                <Link to="/admin/food" className="block p-2 rounded bg-paper-sunken hover:text-brand-700 font-medium">
                  → Food Listings
                </Link>
                <Link to="/admin/claims" className="block p-2 rounded bg-paper-sunken hover:text-brand-700 font-medium">
                  → All Claims
                </Link>
                <Link to="/admin/inventory" className="block p-2 rounded bg-paper-sunken hover:text-brand-700 font-medium">
                  → Raw Material Inventory
                </Link>
                <Link to="/admin/analytics" className="block p-2 rounded bg-paper-sunken hover:text-brand-700 font-medium">
                  → Analytics
                </Link>
                <Link to="/admin/reports" className="block p-2 rounded bg-paper-sunken hover:text-brand-700 font-medium">
                  → Audit Reports
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
