'use client'

import { ProductListItem } from '@/services/marketplace-products.service'

interface ProductTableProps {
  products: ProductListItem[]
  onViewDetails: (productId: string) => void
  onVerify: (productId: string) => void
  onReject: (productId: string) => void
  canVerify: boolean
  verificationErrorMessage?: string
}

export function ProductTable({
  products,
  onViewDetails,
  onVerify,
  onReject,
  canVerify,
  verificationErrorMessage
}: ProductTableProps) {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Business</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Views</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {products.map(product => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{product.title}</p>
                    <p className="text-xs text-gray-500">{product.createdAt.split('T')[0]}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{product.businessName}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                Rs. {product.price.toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(product.verificationStatus)}`}>
                  {product.verificationStatus.charAt(0).toUpperCase() + product.verificationStatus.slice(1)}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{product.viewCount}</td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewDetails(product.id)}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    View
                  </button>
                  {canVerify && product.verificationStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => onVerify(product.id)}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => onReject(product.id)}
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!canVerify && verificationErrorMessage && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Note:</strong> {verificationErrorMessage}
          </p>
        </div>
      )}
    </div>
  )
}
