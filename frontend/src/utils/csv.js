/**
 * Download rows as a CSV file that opens in Excel.
 *   downloadCSV('summary.csv', [['Name', 'Value'], ['Revenue', 150000]])
 */
export function downloadCSV(filename, rows) {
  // Wrap every cell in quotes so commas inside text don't break the columns
  const text = rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}
