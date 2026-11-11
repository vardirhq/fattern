import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react';

export function DataTable({ columns, data, emptyMessage = 'Ingen data å vise', defaultSort = null }) {
  const [sortColumn, setSortColumn] = useState(defaultSort?.column || null);
  const [sortDirection, setSortDirection] = useState(defaultSort?.direction || 'asc');

  const sortedData = useMemo(() => {
    if (!sortColumn || !data || data.length === 0) return data;

    const column = columns.find((col) => col.key === sortColumn);
    if (!column || column.sortable === false) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      if (column.sortFn) {
        return column.sortFn(aValue, bValue, a, b) * (sortDirection === 'asc' ? 1 : -1);
      }

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * (sortDirection === 'asc' ? 1 : -1);
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return (aValue.getTime() - bValue.getTime()) * (sortDirection === 'asc' ? 1 : -1);
      }

      const aDate = typeof aValue === 'string' ? new Date(aValue) : null;
      const bDate = typeof bValue === 'string' ? new Date(bValue) : null;
      if (aDate && bDate && !isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
        return (aDate.getTime() - bDate.getTime()) * (sortDirection === 'asc' ? 1 : -1);
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection, columns]);

  const handleSort = (columnKey) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column || column.sortable === false) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl p-12 text-center" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}>
        <p className="text-sm" style={{ color: 'var(--f-text-subtle)' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--f-border-subtle)' }}>
      <table className="min-w-full text-sm">
        <thead>
          <tr style={{ background: 'var(--f-hover)', borderBottom: '1px solid var(--f-border-subtle)', color: 'var(--f-text-subtle)' }}>
            {columns.map((column) => {
              const isSortable = column.sortable !== false && column.key !== 'actions';
              const isSorted = sortColumn === column.key;
              const isAsc = sortDirection === 'asc';

              return (
                <th
                  key={column.key}
                  className={`px-4 py-3 font-medium ${column.align === 'right' ? 'text-right' : 'text-left'} ${
                    isSortable ? 'cursor-pointer select-none transition-colors' : ''
                  }`}
                  style={{ color: 'var(--f-text-subtle)', ...(column.headerStyle || column.style || {}) }}
                  onClick={() => isSortable && handleSort(column.key)}
                  onMouseEnter={e => { if (isSortable) e.currentTarget.style.background = 'var(--f-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className={`flex items-center gap-2 ${column.align === 'right' ? 'justify-end' : ''}`}>
                    <span>{column.label}</span>
                    {isSortable && (
                      <span className="flex flex-col">
                        <IconChevronUp
                          size={11}
                          style={{ opacity: isSorted && isAsc ? 1 : 0.3, color: isSorted && isAsc ? 'var(--f-green-text)' : 'inherit' }}
                        />
                        <IconChevronDown
                          size={11}
                          style={{ marginTop: -3, opacity: isSorted && !isAsc ? 1 : 0.3, color: isSorted && !isAsc ? 'var(--f-green-text)' : 'inherit' }}
                        />
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <motion.tr
              key={row.id || rowIndex}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: rowIndex * 0.02 }}
              style={{ borderBottom: '1px solid var(--f-border-faint)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--f-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map((column) => {
                const cellValue = row[column.key];
                const content = column.render ? column.render(cellValue, row) : cellValue ?? '—';

                return (
                  <td
                    key={column.key}
                    className={`px-4 py-3 ${column.align === 'right' ? 'text-right' : 'text-left'} ${
                      column.className || ''
                    }`}
                    style={column.style || {}}
                  >
                    {content}
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
