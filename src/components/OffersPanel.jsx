import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Toast from './Toast'
import ConfirmationModal from './ConfirmationModal'

function OffersPanel({ listing, onOfferAccepted }) {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [showPreviousOffers, setShowPreviousOffers] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirmingAction, setConfirmingAction] = useState(null)

  useEffect(() => {
    if (listing) {
      fetchOffers()
      subscribeToOffers()
    }

    return () => {
      supabase.removeChannel(supabase.channel(`offers-${listing.id}`))
    }
  }, [listing.id])

  const fetchOffers = async () => {
    try {
      setLoading(true)

      // Fetch offers with buyer profiles
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('listing_id', listing.id)
        .order('created_at', { ascending: false })

      if (offersError) throw offersError

      if (!offersData || offersData.length === 0) {
        setOffers([])
        setLoading(false)
        return
      }

      // Get all unique buyer IDs
      const buyerIds = [...new Set(offersData.map(o => o.buyer_id))]

      // Fetch all buyer profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, profile_picture_url')
        .in('id', buyerIds)

      if (profilesError) throw profilesError

      // Create a map of profiles by ID
      const profilesMap = {}
      profilesData?.forEach(profile => {
        profilesMap[profile.id] = profile
      })

      // Attach buyer profile to each offer
      const offersWithProfiles = offersData.map(offer => ({
        ...offer,
        buyer_profile: profilesMap[offer.buyer_id]
      }))

      setOffers(offersWithProfiles)
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToOffers = () => {
    const channel = supabase
      .channel(`offers-${listing.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
          filter: `listing_id=eq.${listing.id}`,
        },
        () => {
          fetchOffers()
        }
      )
      .subscribe()
  }

  const handleAccept = async (offer) => {
    try {
      setActionLoading(offer.id)

      // Start a transaction: update offer status and create transaction
      const { data: updatedOffer, error: offerError } = await supabase
        .from('offers')
        .update({ status: 'accepted' })
        .eq('id', offer.id)
        .select()
        .single()

      if (offerError) throw offerError

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          listing_id: listing.id,
          buyer_id: offer.buyer_id,
          seller_id: listing.user_id,
          offer_id: offer.id,
          final_price: offer.amount,
          status: 'pending',
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      // Update listing status to sold
      const { error: listingError } = await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', listing.id)

      if (listingError) throw listingError

      // Decline all other pending offers for this listing
      const { error: declineError } = await supabase
        .from('offers')
        .update({ status: 'declined' })
        .eq('listing_id', listing.id)
        .eq('status', 'pending')
        .neq('id', offer.id)

      if (declineError) throw declineError

      // Refresh offers
      fetchOffers()

      // Notify parent
      if (onOfferAccepted) {
        onOfferAccepted(transaction)
      }
    } catch (error) {
      console.error('Error accepting offer:', error)
      setToast({ message: 'Failed to accept offer. Please try again.', type: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async (offer) => {
    try {
      setActionLoading(offer.id)

      const { error } = await supabase
        .from('offers')
        .update({ status: 'declined' })
        .eq('id', offer.id)

      if (error) throw error

      fetchOffers()
    } catch (error) {
      console.error('Error declining offer:', error)
      setToast({ message: 'Failed to decline offer. Please try again.', type: 'error' })
    } finally {
      setActionLoading(null)
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
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      countered: 'bg-blue-100 text-blue-800',
      withdrawn: 'bg-gray-100 text-gray-800',
    }
    return badges[status] || badges.pending
  }

  const pendingOffers = offers.filter(o => o.status === 'pending')
  const otherOffers = offers.filter(o => o.status !== 'pending')

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No offers yet
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
          duration={5000}
        />
      )}

      <div className="space-y-3">
      {/* Pending Offers */}
      {pendingOffers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Pending Offers ({pendingOffers.length})</h4>
          {pendingOffers.map((offer) => (
            <div key={offer.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    {offer.buyer_profile?.profile_picture_url ? (
                      <img
                        src={offer.buyer_profile.profile_picture_url}
                        alt={offer.buyer_profile.username}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">@{offer.buyer_profile?.username}</p>
                      <p className="text-xs text-gray-500">{formatDate(offer.created_at)}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(offer.amount)}</p>
                  <p className="text-xs text-gray-500">
                    {((offer.amount / listing.price) * 100).toFixed(0)}% of asking
                  </p>
                </div>
              </div>

              {offer.message && (
                <div className="mb-2">
                  <p className="text-sm text-gray-700 italic">"{offer.message}"</p>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => setConfirmingAction({ type: 'accept', offer })}
                  disabled={actionLoading === offer.id}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === offer.id ? 'Processing...' : 'Accept'}
                </button>
                <button
                  onClick={() => setConfirmingAction({ type: 'decline', offer })}
                  disabled={actionLoading === offer.id}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Previous Offers (Collapsible) */}
      {otherOffers.length > 0 && (
        <div>
          <button
            onClick={() => setShowPreviousOffers(!showPreviousOffers)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 transition py-2"
          >
            <span>{showPreviousOffers ? 'Hide' : 'Show'} {otherOffers.length} Previous Offer{otherOffers.length !== 1 ? 's' : ''}</span>
            <svg
              className={`w-4 h-4 transition-transform ${showPreviousOffers ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPreviousOffers && (
            <div className="space-y-2 mt-2">
              {otherOffers.map((offer) => (
                <div key={offer.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">@{offer.buyer_profile?.username}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(offer.status)}`}>
                        {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatPrice(offer.amount)}</p>
                      <p className="text-xs text-gray-500">{formatDate(offer.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmingAction}
        onClose={() => setConfirmingAction(null)}
        onConfirm={() => {
          if (confirmingAction?.type === 'accept') {
            handleAccept(confirmingAction.offer)
          } else if (confirmingAction?.type === 'decline') {
            handleDecline(confirmingAction.offer)
          }
        }}
        title={confirmingAction?.type === 'accept' ? 'Accept Offer' : 'Decline Offer'}
        message={
          confirmingAction?.type === 'accept'
            ? `Are you sure you want to accept this offer of €${confirmingAction?.offer?.amount.toFixed(2)} from @${confirmingAction?.offer?.buyer_profile?.username}? This action is irreversible and will mark the listing as sold.`
            : `Are you sure you want to decline this offer of €${confirmingAction?.offer?.amount.toFixed(2)} from @${confirmingAction?.offer?.buyer_profile?.username}?`
        }
        confirmText={confirmingAction?.type === 'accept' ? 'Accept Offer' : 'Decline Offer'}
        isDangerous={confirmingAction?.type === 'decline'}
      />
    </>
  )
}

export default OffersPanel
