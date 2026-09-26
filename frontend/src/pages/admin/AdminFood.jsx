import { useCallback, useEffect, useState } from 'react'
import { Salad, Search, Filter, MapPin, Calendar, Clock } from 'lucide-react'
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

export default function AdminFood() {
  const [foods, setFoods] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [conditionFilter, setConditionFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const load = useCallback(async () => {
    try {
      setError('')
      const data = await adminService.getFood()
      setFoods(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Could not load food listings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <DashboardLayout role="ADMIN" title="Food listings">
        <LoadingState label="Loading all platform food listings…" />
      </DashboardLayout>
    )
  }

  const filteredFoods = (foods || []).filter((f) => {
    const matchesSearch =
      (f.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.kitchen_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.description || '').toLowerCase().includes(search.toLowerCase())
    const matchesCondition = conditionFilter === 'ALL' || f.condition === conditionFilter
    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter
    return matchesSearch && matchesCondition && matchesStatus
  })

  return (
    <DashboardLayout role="ADMIN" title="Food listings">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader
          title="All Platform Food Listings"
          description="    "
        />
        <Button onClick={load} variant="secondary">
          Refresh Listings
        </Button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {/* Filter and Search Bar */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                placeholder="Search food title or provider..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full h-10 px-3 rounded-sm border border-line bg-paper text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
              >
                <option value="ALL">All Conditions</option>
                <option value="GOOD">Edible (GOOD)</option>
                <option value="ROTTEN">Spoiled / Organic Waste (ROTTEN)</option>
              </select>
            </div>
            <div>
              <select
                className="w-full h-10 px-3 rounded-sm border border-line bg-paper text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="CLAIMED">Claimed / Out of stock</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Food Listings Table / Grid */}
      {filteredFoods.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Salad size={36} className="mx-auto mb-3 text-ink-soft" />
              <p className="font-medium">No food listings match your filters</p>
              <p className="text-xs text-ink-soft mt-1">Try clearing search terms or changing condition filters.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-ink-soft mb-2 font-medium">
            Showing {filteredFoods.length} of {foods.length} listings
          </div>

          <div className="overflow-x-auto border border-line rounded-sm bg-paper-raised">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-sunken/60 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  <th className="py-3 px-4">Food Item</th>
                  <th className="py-3 px-4">Provider / Kitchen</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Available Qty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Meal Type</th>
                  <th className="py-3 px-4">Listed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredFoods.map((f) => (
                  <tr key={f.id} className="hover:bg-paper-sunken/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink">{f.title}</div>
                      {f.description && (
                        <div className="text-xs text-ink-soft line-clamp-1">{f.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-ink">
                      {f.kitchen_name || 'Kitchen'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={f.condition === 'ROTTEN' ? 'danger' : 'success'}>
                        {f.condition === 'ROTTEN' ? 'ROTTEN (Biogas)' : 'GOOD (Edible)'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-ink">{f.remaining_quantity}</span> / {f.quantity} {f.unit}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={f.status === 'AVAILABLE' ? 'primary' : 'neutral'}>
                        {f.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-ink-soft">
                      {f.meal_type || 'General'}
                    </td>
                    <td className="py-3 px-4 text-xs text-ink-soft whitespace-nowrap">
                      {formatDateTime(f.created_at)}
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
