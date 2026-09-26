import { useCallback, useEffect, useState } from 'react'
import { Boxes, Search, AlertTriangle, CheckCircle2 } from 'lucide-react'
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

export default function AdminInventory() {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      setError('')
      const data = await adminService.getInventory()
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Could not load inventory items')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <DashboardLayout role="ADMIN" title="Inventory">
        <LoadingState label="Loading cross-kitchen inventory data…" />
      </DashboardLayout>
    )
  }

  const filteredItems = (items || []).filter((item) => {
    return (
      (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.kitchen_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <DashboardLayout role="ADMIN" title="Inventory">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader
          title="Raw Material Inventory Oversight"
          description="    "
        />
        <Button onClick={load} variant="secondary">
          Refresh Inventory
        </Button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {/* Search Input */}
      <Card className="mb-6">
        <CardBody>
          <Input
            placeholder="Search by ingredient name, kitchen, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardBody>
      </Card>

      {/* Inventory Table */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Boxes size={36} className="mx-auto mb-3 text-ink-soft" />
              <p className="font-medium">No inventory records found</p>
              <p className="text-xs text-ink-soft mt-1">Raw materials logged by kitchens will appear here.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-ink-soft mb-2 font-medium">
            Showing {filteredItems.length} of {items.length} inventory items
          </div>

          <div className="overflow-x-auto border border-line rounded-sm bg-paper-raised">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-sunken/60 text-xs font-semibold text-ink-soft uppercase tracking-wider">
                  <th className="py-3 px-4">Ingredient / Item</th>
                  <th className="py-3 px-4">Kitchen</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Minimum Threshold</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4">Logged Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredItems.map((item) => {
                  const isLow = item.quantity <= item.minimum_stock
                  return (
                    <tr key={item.id} className="hover:bg-paper-sunken/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-ink">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 font-medium text-ink">
                        {item.kitchen_name}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="neutral">{item.category}</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold text-ink">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-xs text-ink-soft">
                        {item.minimum_stock} {item.unit}
                      </td>
                      <td className="py-3 px-4">
                        {isLow ? (
                          <Badge variant="danger" className="flex items-center gap-1 w-fit">
                            <AlertTriangle size={12} /> Low Stock Alert
                          </Badge>
                        ) : (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 size={12} /> Sufficient Stock
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-ink-soft whitespace-nowrap">
                        {formatDateTime(item.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
