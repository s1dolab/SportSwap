import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import OffersPanel from '../components/OffersPanel'
import Toast from '../components/Toast'
import ConfirmationModal from '../components/ConfirmationModal'

function MyListingsPage() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active') // 'active', 'sold', 'draft'
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [confirmingSold, setConfirmingSold] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (user) {
      fetchListings()
    }
  }, [user])

  const fetchListings = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          listing_images(image_url, display_order)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get listing IDs for sold items to fetch buyer info
      const soldListingIds = data.filter(l => l.status === 'sold').map(l => l.id)

      // Fetch transactions for sold items
      let buyersMap = {}
      if (soldListingIds.length > 0) {
        const { data: transactionsData } = await supabase
          .from('transactions')
          .select('listing_id, buyer_id, profiles!transactions_buyer_id_fkey(id, username)')
          .in('listing_id', soldListingIds)

        if (transactionsData) {
          transactionsData.forEach(transaction => {
            buyersMap[transaction.listing_id] = transaction.profiles
          })
        }
      }

      // Format listings with images and buyer info
      const formattedListings = data.map((listing) => ({
        ...listing,
        images: listing.listing_images.sort((a, b) => a.display_order - b.display_order),
        buyer_profile: buyersMap[listing.id] || null,
      }))

      setListings(formattedListings)
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (listingId, newStatus) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', listingId)

      if (error) throw error

      // Update local state
      setListings(listings.map(listing =>
        listing.id === listingId ? { ...listing, status: newStatus } : listing
      ))
      setToast({ message: 'Listing status updated successfully', type: 'success' })
    } catch (error) {
      console.error('Error updating listing status:', error)
      setToast({ message: 'Failed to update listing status', type: 'error' })
    }
  }

  const handleDelete = async (listingId) => {
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)

      if (error) throw error

      // Remove from local state
      setListings(listings.filter(listing => listing.id !== listingId))
      setDeleteConfirm(null)
      setToast({ message: 'Listing deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Error deleting listing:', error)
      setToast({ message: 'Failed to delete listing', type: 'error' })
    }
  }

  // Filter listings by status
  const filteredListings = listings.filter(l => l.status === activeTab)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 mt-4">Loading your listings...</p>
      </div>
    )
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <Link
            to="/listings/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Create New Listing
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-4 font-medium border-b-2 transition ${
              activeTab === 'active'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Active ({listings.filter(l => l.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('sold')}
            className={`py-4 font-medium border-b-2 transition ${
              activeTab === 'sold'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Sold ({listings.filter(l => l.status === 'sold').length})
          </button>
          <button
            onClick={() => setActiveTab('draft')}
            className={`py-4 font-medium border-b-2 transition ${
              activeTab === 'draft'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Drafts ({listings.filter(l => l.status === 'draft').length})
          </button>
        </div>
      </div>

      {/* Listings Content */}
      <div className="p-6">
        {filteredListings.length === 0 ? (
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {activeTab} listings
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'active' && "You don't have any active listings at the moment."}
              {activeTab === 'sold' && "You haven't sold any items yet."}
              {activeTab === 'draft' && "You don't have any draft listings."}
            </p>
            <Link
              to="/listings/new"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Create Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <Link
                    to={`/listings/${listing.id}`}
                    className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden"
                  >
                    {listing.images?.[0]?.image_url ? (
                      <img
                        src={listing.images[0].image_url}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-grow">
                    <Link
                      to={`/listings/${listing.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition"
                    >
                      {listing.title}
                    </Link>
                    <div className="text-xl font-bold text-gray-900 mt-1">
                      {formatPrice(listing.price)}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      <span className="capitalize">{listing.category}</span>
                      {listing.subcategory && (
                        <span> • {listing.subcategory.replace('_', ' ')}</span>
                      )}
                      <span> • {listing.city}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Posted {new Date(listing.created_at).toLocaleDateString()}
                    </div>
                    {listing.status === 'sold' && listing.buyer_profile && (
                      <div className="text-sm text-gray-600 mt-1">
                        Buyer:{' '}
                        <Link
                          to={`/profile/${listing.buyer_profile.username}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          @{listing.buyer_profile.username}
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col justify-between items-end">
                    <div className="flex gap-2">
                      <Link
                        to={`/listings/${listing.id}/edit`}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(listing.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Status Change */}
                    <div>
                      {activeTab === 'active' && (
                        <button
                          onClick={() => setConfirmingSold(listing.id)}
                          className="text-sm px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
                        >
                          Mark as Sold
                        </button>
                      )}
                      {activeTab === 'sold' && (
                        <button
                          onClick={() => handleStatusChange(listing.id, 'active')}
                          className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                        >
                          Reactivate
                        </button>
                      )}
                      {activeTab === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(listing.id, 'active')}
                          className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Offers Panel - Only show for active listings */}
                {listing.status === 'active' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Offers on this listing</h3>
                    <OffersPanel listing={listing} onOfferAccepted={fetchListings} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm)}
        title="Delete Listing"
        message="Are you sure you want to delete this listing? This action cannot be undone."
        confirmText="Yes, Delete"
        isDangerous={true}
      />

      {/* Mark as Sold Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmingSold}
        onClose={() => setConfirmingSold(null)}
        onConfirm={() => {
          handleStatusChange(confirmingSold, 'sold')
          setConfirmingSold(null)
        }}
        title="Mark as Sold"
        message="Are you sure you want to mark this listing as sold? You can reactivate it later if needed."
        confirmText="Mark as Sold"
        isDangerous={false}
      />
    </div>
    </>
  )
}

export default MyListingsPage
