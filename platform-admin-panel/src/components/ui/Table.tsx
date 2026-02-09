import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TableProps {
  children: ReactNode
  className?: string
  colSpan?: number
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm', className)}>
        {children}
      </table>
    </div>
  )
}

export function TableHead({ children, className }: TableProps) {
  return (
    <thead className={cn('bg-slate-50 border-b border-slate-200', className)}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className }: TableProps) {
  return (
    <tbody className={cn('divide-y divide-slate-200', className)}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr className={cn('hover:bg-slate-50 transition-colors', className)}>
      {children}
    </tr>
  )
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <th className={cn('px-6 py-3 text-left font-semibold text-slate-700', className)}>
      {children}
    </th>
  )
}

export function TableCell({ children, className, colSpan }: TableProps) {
  return (
    <td colSpan={colSpan} className={cn('px-6 py-4 text-slate-900', className)}>
      {children}
    </td>
  )
}
