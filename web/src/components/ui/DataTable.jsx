// -----------------------------------------------------------------------------
// File: DataTable.jsx
// Purpose: Shared table shell with sticky-styled header, row hover, loading
//          skeletons and an empty state, so every listing screen matches.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------
import EmptyState from "./EmptyState";

// Renders `columns` against `rows`; each column is { key, header, render, className }.
export default function DataTable({ columns, rows, loading, empty, rowKey = (r) => r.id }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`whitespace-nowrap px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 ${c.className || ""}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-6 py-4">
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                  </td>
                ))}
              </tr>
            ))}

          {!loading &&
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-slate-50 transition-colors last:border-0 hover:bg-brand-50/40"
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-6 py-4 text-sm text-slate-700 ${c.className || ""}`}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>

      {!loading && rows.length === 0 && empty && (
        <EmptyState {...empty} />
      )}
    </div>
  );
}
