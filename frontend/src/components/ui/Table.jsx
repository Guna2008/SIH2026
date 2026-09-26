export default function Table({ columns = [], rows = [], emptyLabel = 'No records yet' }) {
  if (rows.length === 0) {
    return (
      <div className="py-14 text-center text-sm text-ink-soft border border-dashed border-line rounded-md">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border border-line rounded-md">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-paper-sunken border-b border-line">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left font-medium text-ink-soft px-4 py-3 whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="border-b border-line last:border-0 hover:bg-paper-sunken/50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-ink align-middle whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
