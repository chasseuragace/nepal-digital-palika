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
    <div className="table-container">
      <table className="products-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Business</th>
            <th>Category</th>
            <th>Price</th>
            <th>Status</th>
            <th>Views</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>
                <div className="product-name-cell">
                  <div className="product-info">
                    <p className="product-title">{product.title}</p>
                    <p className="product-date">{product.createdAt.split('T')[0]}</p>
                  </div>
                </div>
              </td>
              <td>{product.businessName}</td>
              <td>{product.category}</td>
              <td>
                <div className="price-cell">
                  <span className="price-value">Rs. {product.price.toLocaleString()}</span>
                </div>
              </td>
              <td>
                <span className={`status-badge ${product.verificationStatus}`}>
                  {product.verificationStatus.charAt(0).toUpperCase() + product.verificationStatus.slice(1)}
                </span>
              </td>
              <td>{product.viewCount}</td>
              <td>
                <div className="action-buttons">
                  <button
                    onClick={() => onViewDetails(product.id)}
                    className="btn-view"
                  >
                    View
                  </button>
                  {canVerify && product.verificationStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => onVerify(product.id)}
                        className="btn-edit"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => onReject(product.id)}
                        className="btn-edit"
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
        <div className="alert alert-warning">
          <p>
            <strong>ℹ️ Note:</strong> {verificationErrorMessage}
          </p>
        </div>
      )}
    </div>
  )
}
