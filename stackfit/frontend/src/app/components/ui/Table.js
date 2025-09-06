'use client'
import {
  Table as ShadcnTable,
  TableBody as ShadcnTableBody,
  TableCell as ShadcnTableCell,
  TableHead as ShadcnTableHead,
  TableHeader as ShadcnTableHeader,
  TableRow as ShadcnTableRow,
} from "@/components/ui/table"

export function Table({ children, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <ShadcnTable>
        {children}
      </ShadcnTable>
    </div>
  )
}

export function TableHead({ children, className = '' }) {
  return (
    <ShadcnTableHeader className={className}>
      {children}
    </ShadcnTableHeader>
  )
}

export function TableBody({ children, className = '' }) {
  return (
    <ShadcnTableBody className={className}>
      {children}
    </ShadcnTableBody>
  )
}

export function TableRow({ children, className = '', isHeader = false }) {
  return (
    <ShadcnTableRow className={`
      ${className}
      ${!isHeader && 'hover:bg-white/5 transition-colors duration-200'}
    `}>
      {children}
    </ShadcnTableRow>
  )
}

export function TableCell({ children, className = '', isHeader = false }) {
  return isHeader ? (
    <ShadcnTableHead className={`text-left text-xs font-medium text-[#8B7CF7] uppercase tracking-wider ${className}`}>
      {children}
    </ShadcnTableHead>
  ) : (
    <ShadcnTableCell className={`whitespace-nowrap text-sm text-gray-300 ${className}`}>
      {children}
    </ShadcnTableCell>
  )
}

// Export all components
export default {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} 