import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ReviewModal from '../components/ReviewModal'

function OrderHistoryPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('bought') // 'bought' or 'sold'
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      // Fetch all transactions where user is buyer or seller
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          listings!inner(id, title, price, listing_images(image_url, display_order)),
          buyer_profile:profiles!transactions_buyer_id_fkey(id, username, profile_picture_url),
          seller_profile:profiles!transactions_seller_id_fkey(id, username, profile_picture_url)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError

      // Fetch reviews for these transactions where current user is the reviewer
      const transactionIds = transactionsData.map(t => t.id)

      let reviewsMap = {}
      if (transactionIds.length > 0) {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .in('transaction_id', transactionIds)
          .eq('reviewer_id', user.id)

        if (reviewsData) {
          reviewsData.forEach(review => {
            reviewsMap[review.transaction_id] = review
          })
        }
      }

      // Format transactions with review info
      const formattedTransactions = transactionsData.map(transaction => ({
        ...transaction,
        listing_image: transaction.listings.listing_images?.[0]?.image_url || null,
        my_review: reviewsMap[transaction.id] || null,
      }))

      setTransactions(formattedTransactions)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenReviewModal = (transaction) => {
    setSelectedTransaction(transaction)
    setReviewModalOpen(true)
  }

  const handleReviewSubmitted = () => {
    setReviewModalOpen(false)
    setSelectedTransaction(null)
    fetchTransactions() // Refresh to show the new review
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Filter transactions based on active tab
  const boughtTransactions = transactions.filter(t => t.buyer_id === user?.id)
  const soldTransactions = transactions.filter(t => t.seller_id === user?.id)
  const activeTransactions = activeTab === 'bought' ? boughtTransactions : soldTransactions

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4">Loading order history...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-600 mt-1">View your purchase and sales history</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('bought')}
              className={`py-4 font-medium border-b-2 transition ${
                activeTab === 'bought'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Bought Items ({boughtTransactions.length})
            </button>
            <button
              onClick={() => setActiveTab('sold')}
              className={`py-4 font-medium border-b-2 transition ${
                activeTab === 'sold'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Sold Items ({soldTransactions.length})
            </button>
          </div>
        </div>

        {/* Transactions Content */}
        <div className="p-6">
          {activeTransactions.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No {activeTab} items yet
              </h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'bought'
                  ? "You haven't purchased any items yet."
                  : "You haven't sold any items yet."}
              </p>
              <Link
                to="/browse"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Browse Listings
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTransactions.map((transaction) => {
                const otherPerson =
                  activeTab === 'bought'
                    ? transaction.seller_profile
                    : transaction.buyer_profile
                const otherPersonRole = activeTab === 'bought' ? 'Seller' : 'Buyer'

                return (
                  <div
                    key={transaction.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      <Link
                        to={`/listings/${transaction.listing_id}`}
                        className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden"
                      >
                        {transaction.listing_image ? (
                          <img
                            src={transaction.listing_image}
                            alt={transaction.listings.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </Link>

                      {/* Info */}
                      <div className="flex-grow">
                        <Link
                          to={`/listings/${transaction.listing_id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition"
                        >
                          {transaction.listings.title}
                        </Link>
                        <div className="text-xl font-bold text-gray-900 mt-1">
                          {formatPrice(transaction.amount)}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                          <span>{formatDate(transaction.created_at)}</span>
                          {otherPerson && (
                            <Link
                              to={`/profile/${otherPerson.username}`}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {otherPersonRole}: @{otherPerson.username}
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Review Action */}
                      <div className="flex-shrink-0 flex items-center">
                        {transaction.my_review ? (
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-1">You rated:</div>
                            <div className="flex items-center text-yellow-500">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-5 h-5 ${
                                    star <= transaction.my_review.rating
                                      ? 'fill-current'
                                      : 'fill-none stroke-current'
                                  }`}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                  />
                                </svg>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenReviewModal(transaction)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                          >
                            Leave Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedTransaction && (
        <ReviewModal
          transaction={selectedTransaction}
          reviewedUser={
            activeTab === 'bought'
              ? selectedTransaction.seller_profile
              : selectedTransaction.buyer_profile
          }
          onClose={() => {
            setReviewModalOpen(false)
            setSelectedTransaction(null)
          }}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </>
  )
}

export default OrderHistoryPage
