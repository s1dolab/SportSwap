import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

function MyOffersPage() {
  const { user } = useAuth()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending') // 'pending', 'accepted', 'all'

  useEffect(() => {
    if (user) {
      fetchOffers()
      subscribeToOffers()
    }

    return () => {
      supabase.removeChannel(supabase.channel(`my-offers-${user?.id}`))
    }
  }, [user])

  const fetchOffers = async () => {
    try {
      setLoading(true)

      // Fetch user's offers
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      if (offersError) throw offersError

      if (!offersData || offersData.length === 0) {
        setOffers([])
        setLoading(false)
        return
      }

      // Get all unique listing IDs
      const listingIds = [...new Set(offersData.map(o => o.listing_id))]

      // Fetch all listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, price, status, user_id')
        .in('id', listingIds)

      if (listingsError) throw listingsError

      // Fetch listing images
      const { data: imagesData } = await supabase
        .from('listing_images')
        .select('listing_id, image_url, display_order')
        .in('listing_id', listingIds)
        .eq('display_order', 0)

      // Create maps
      const listingsMap = {}
      listingsData?.forEach(listing => {
        listingsMap[listing.id] = listing
      })

      const imagesMap = {}
      imagesData?.forEach(img => {
        imagesMap[img.listing_id] = img.image_url
      })

      // Fetch seller profiles
      const sellerIds = [...new Set(listingsData?.map(l => l.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, profile_picture_url')
        .in('id', sellerIds)

      const profilesMap = {}
      profilesData?.forEach(profile => {
        profilesMap[profile.id] = profile
      })

      // Combine data
      const offersWithListings = offersData.map(offer => ({
        ...offer,
        listing: listingsMap[offer.listing_id],
        listing_image: imagesMap[offer.listing_id],
        seller_profile: profilesMap[listingsMap[offer.listing_id]?.user_id]
      }))

      setOffers(offersWithListings)
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToOffers = () => {
    const channel = supabase
      .channel(`my-offers-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
          filter: `buyer_id=eq.${user.id}`,
        },
        () => {
          fetchOffers()
        }
      )
      .subscribe()
  }

  const handleWithdraw = async (offerId) => {
    if (!confirm('Withdraw this offer?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: 'withdrawn' })
        .eq('id', offerId)

      if (error) throw error

      fetchOffers()
    } catch (error) {
      console.error('Error withdrawing offer:', error)
      alert('Failed to withdraw offer. Please try again.')
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      accepted: { class: 'bg-green-100 text-green-800', text: 'Accepted' },
      declined: { class: 'bg-red-100 text-red-800', text: 'Declined' },
      countered: { class: 'bg-blue-100 text-blue-800', text: 'Countered' },
      withdrawn: { class: 'bg-gray-100 text-gray-800', text: 'Withdrawn' },
    }
    return badges[status] || badges.pending
  }

  // Filter offers based on active tab
  const filteredOffers = offers.filter(offer => {
    if (activeTab === 'pending') return offer.status === 'pending'
    if (activeTab === 'accepted') return offer.status === 'accepted'
    return true // 'all' tab
  })

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4">Loading offers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">My Offers</h1>
        <p className="text-gray-600 mt-1">Track offers you've made on listings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 font-medium border-b-2 transition ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending ({offers.filter(o => o.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`py-4 font-medium border-b-2 transition ${
              activeTab === 'accepted'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Accepted ({offers.filter(o => o.status === 'accepted').length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 font-medium border-b-2 transition ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({offers.length})
          </button>
        </div>
      </div>

      {/* Offers Content */}
      <div className="p-6">
        {filteredOffers.length === 0 ? (
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
              No {activeTab} offers
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'pending' && "You don't have any pending offers at the moment."}
              {activeTab === 'accepted' && "You don't have any accepted offers yet."}
              {activeTab === 'all' && "You haven't made any offers yet."}
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
            {filteredOffers.map((offer) => {
              const statusBadge = getStatusBadge(offer.status)

              return (
                <div
                  key={offer.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  {/* Safety check: Skip if listing is missing/deleted */}
                  {!offer.listing ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">Listing no longer available</p>
                      <p className="text-xs mt-1">
                        Offer: {formatPrice(offer.amount)} • {getStatusBadge(offer.status).text}
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      {/* Image */}
                      <Link
                        to={`/listings/${offer.listing.id}`}
                        className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden"
                      >
                        {offer.listing_image ? (
                          <img
                            src={offer.listing_image}
                            alt={offer.listing.title}
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
                        <div className="flex justify-between items-start">
                          <div>
                            <Link
                              to={`/listings/${offer.listing.id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition"
                            >
                              {offer.listing.title}
                            </Link>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge.class}`}>
                              {statusBadge.text}
                            </span>
                            {offer.listing?.status === 'sold' && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                                Listing Sold
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                        <div className="text-right">
                          <div className="text-sm text-gray-600">Your Offer</div>
                          <div className="text-2xl font-bold text-gray-900">{formatPrice(offer.amount)}</div>
                          <div className="text-sm text-gray-500">
                            Asking: {formatPrice(offer.listing?.price)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        Seller:
                        <Link
                          to={`/profile/${offer.seller_profile?.username}`}
                          className="ml-1 font-medium text-blue-600 hover:text-blue-700"
                        >
                          @{offer.seller_profile?.username}
                        </Link>
                      </div>

                      {offer.message && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700 italic">
                          "{offer.message}"
                        </div>
                      )}

                      <div className="mt-2 flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          Submitted {formatDate(offer.created_at)}
                        </div>

                        {offer.status === 'pending' && (
                          <button
                            onClick={() => handleWithdraw(offer.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Withdraw Offer
                          </button>
                        )}

                        {offer.status === 'accepted' && (
                          <Link
                            to="/messages"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Contact Seller →
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyOffersPage
