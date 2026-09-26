import { useCallback, useEffect, useState } from 'react'
import { HandHeart, Search, Filter, CheckCircle2, Clock } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Card, { CardBody } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { adminService } from '../../services/adminService'
import { formatDateTime } from '../../lib/format'

export default function AdminClaims() {
  const [claims, setClaims] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const load = useCallback(async () => {
    try {
      setError('')
      const data = await adminService.getClaims()
      setClaims(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Could not load claims')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <DashboardLayout role="ADMIN" title="Claims">
        <LoadingState label="Loading redistribution claims history…" />
      </DashboardLayout>
    )
  }

  const filteredClaims = (claims || []).filter((c) => {
    const matchesSearch =
      (c.food_title || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.claimant_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.kitchen_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.claimant_role || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <DashboardLayout role="ADMIN" title="Claims">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader
          title="All Redistribution Claims"
          description="    "
        />
        <Button onClick={load} variant="secondary">
          Refresh Claims
        </Button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {/* Filter and Search Bar */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              placeholder="Search by food title, recipient, or provider..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div>
              <select
                className="w-full h-10 px-3 rounded-sm border border-line bg-paper text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="CLAIMED">Awaiting Pickup / Verification</option>
                <option value="COMPLETED">Completed Handover</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Claims Table */}
      {filteredClaims.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <HandHeart size={36} className="mx-auto mb-3 text-ink-soft" />
              <p className="font-medium">No claims match your criteria</p>
              <p className="text-xs text-ink-soft mt-1">Try modifying the search filter.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-ink-soft mb-2 font-medium">
            Showing {filteredClaims.length} of {claims.length} claims
          </div>

          <div className="overflow-x-auto border border-line rounded-sm bg-paper-raised">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-sunken/60 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Food Item</th>
                  <th className="py-3 px-4">Claimed By</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verification PIN</th>
                  <th className="py-3 px-4">Date Claimed</th>
                  <th className="py-3 px-4">Date Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredClaims.map((c) => (
                  <tr key={c.id} className="hover:bg-paper-sunken/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-ink-soft">
                      #{c.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-ink">
                      {c.food_title}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-ink">{c.claimant_name || 'Recipient'}</div>
                      <Badge variant="neutral" className="mt-0.5 text-[10px]">
                        {c.claimant_role || 'RECIPIENT'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-ink">
                      {c.kitchen_name || 'Kitchen'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-ink">
                      {c.quantity} servings
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={c.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {c.pin ? (
                        <span className="bg-paper-sunken px-2 py-0.5 rounded border border-line tracking-wider">
                          {c.pin}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-ink-soft whitespace-nowrap">
                      {formatDateTime(c.created_at)}
                    </td>
                    <td className="py-3 px-4 text-xs text-ink-soft whitespace-nowrap">
                      {c.verified_at ? formatDateTime(c.verified_at) : 'Pending pickup'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
