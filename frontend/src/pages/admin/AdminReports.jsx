import { useCallback, useEffect, useState } from 'react'
import { FileBarChart, Download, Building2, Salad, HandHeart } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PageHeader from '../../components/ui/PageHeader'
import Card, { CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import LoadingState from '../../components/ui/LoadingState'
import ErrorState from '../../components/ui/ErrorState'
import { adminService } from '../../services/adminService'
import { formatDateTime } from '../../lib/format'

export default function AdminReports() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setError('')
      const data = await adminService.getReports()
      setReport(data)
    } catch (e) {
      setError(e.message || 'Could not load reports data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const exportCSV = (filename, rows) => {
    if (!rows || rows.length === 0) return
    const headers = Object.keys(rows[0])
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(field => {
          const val = row[field] ?? ''
          const escaped = String(val).replace(/"/g, '""')
          return `"${escaped}"`
        }).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <DashboardLayout role="ADMIN" title="Reports">
        <LoadingState label="Preparing audit reports and platform logs…" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="ADMIN" title="Reports">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader
          title="Audit Reports & Data Exports"
          description="    "
        />
        <Button onClick={load} variant="secondary">
          Refresh Data
        </Button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {/* Export Cards */}
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <Card className="hover:border-brand-500 transition-colors">
          <CardBody>
            <div className="flex items-center gap-3 mb-3">
              <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-sm">
                <Building2 size={20} />
              </span>
              <div>
                <h3 className="font-display font-semibold text-base">Organizations Audit</h3>
                <p className="text-xs text-ink-soft">{report?.organizations_count || 0} registered entities</p>
              </div>
            </div>

            <Button
              className="w-full flex items-center justify-center gap-2"
              variant="secondary"
              onClick={() => exportCSV('organizations_audit.csv', report?.organizations || [])}
            >
              <Download size={14} /> Export Organizations CSV
            </Button>
          </CardBody>
        </Card>

        <Card className="hover:border-brand-500 transition-colors">
          <CardBody>
            <div className="flex items-center gap-3 mb-3">
              <span className="p-2.5 bg-amber-50 text-amber-700 rounded-sm">
                <Salad size={20} />
              </span>
              <div>
                <h3 className="font-display font-semibold text-base">Surplus Listings Audit</h3>
                <p className="text-xs text-ink-soft">{report?.food_listings_count || 0} batches listed</p>
              </div>
            </div>

            <Button
              className="w-full flex items-center justify-center gap-2"
              variant="secondary"
              onClick={() => exportCSV('food_listings_audit.csv', report?.food_listings || [])}
            >
              <Download size={14} /> Export Food Listings CSV
            </Button>
          </CardBody>
        </Card>

        <Card className="hover:border-brand-500 transition-colors">
          <CardBody>
            <div className="flex items-center gap-3 mb-3">
              <span className="p-2.5 bg-purple-50 text-purple-700 rounded-sm">
                <HandHeart size={20} />
              </span>
              <div>
                <h3 className="font-display font-semibold text-base">Claims & Handover Log</h3>
                <p className="text-xs text-ink-soft">{report?.claims_count || 0} transactions</p>
              </div>
            </div>

            <Button
              className="w-full flex items-center justify-center gap-2"
              variant="secondary"
              onClick={() => exportCSV('claims_handover_log.csv', report?.claims || [])}
            >
              <Download size={14} /> Export Claims CSV
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Activity Preview */}
      <div>
        <h3 className="font-display text-lg font-semibold text-ink mb-3">Recent Transactions Preview</h3>
        {(!report?.claims || report.claims.length === 0) ? (
          <Card>
            <CardBody>
              <div className="text-center py-8 text-sm text-ink-soft">
                No recent transactions recorded in report preview.
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="overflow-x-auto border border-line rounded-sm bg-paper-raised">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-sunken/60 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Food Item</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.claims.slice(0, 5).map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 px-4 font-mono text-xs text-ink-soft">#{c.id}</td>
                    <td className="py-3 px-4 font-semibold text-ink">{c.food_title}</td>
                    <td className="py-3 px-4 font-medium text-ink">{c.claimant_name}</td>
                    <td className="py-3 px-4">{c.quantity} portions</td>
                    <td className="py-3 px-4">
                      <Badge variant={c.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-ink-soft">{formatDateTime(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
