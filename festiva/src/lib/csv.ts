function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

/** Genera e scarica un file CSV lato client (nessun servizio esterno). */
export function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rows.map((r) => r.map(escapeCell).join(',')).join('\n')
  // BOM per la compatibilità con Excel sui caratteri accentati.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
