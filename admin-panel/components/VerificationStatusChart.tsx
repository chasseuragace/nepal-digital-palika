'use client'

interface VerificationStatusChartProps {
  pending: number
  verified: number
  rejected: number
}

export function VerificationStatusChart({ pending, verified, rejected }: VerificationStatusChartProps) {
  const total = pending + verified + rejected
  const pendingPercent = total > 0 ? (pending / total) * 100 : 0
  const verifiedPercent = total > 0 ? (verified / total) * 100 : 0
  const rejectedPercent = total > 0 ? (rejected / total) * 100 : 0

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Pending</span>
            <span className="text-sm font-semibold text-yellow-600">{pending}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="h-2 rounded-full bg-yellow-500" style={{ width: `${pendingPercent}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Verified</span>
            <span className="text-sm font-semibold text-green-600">{verified}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="h-2 rounded-full bg-green-500" style={{ width: `${verifiedPercent}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Rejected</span>
            <span className="text-sm font-semibold text-red-600">{rejected}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="h-2 rounded-full bg-red-500" style={{ width: `${rejectedPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
