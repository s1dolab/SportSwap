import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function MakeOfferModal({ listing, isOpen, onClose, onOfferSubmitted }) {
  const { user } = useAuth()
  const [offerAmount, setOfferAmount] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Prevent users from making offers on their own listings
    if (user.id === listing.user_id) {
      setError('You cannot make an offer on your own listing')
      return
    }

    // Validation
    const amount = parseFloat(offerAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid offer amount')
      return
    }

    if (amount > listing.price) {
      setError('Offer cannot exceed the asking price.')
      return
    }

    try {
      setSubmitting(true)

      // Check if user already has a pending offer for this listing
      const { data: existingOffers, error: checkError } = await supabase
        .from('offers')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('buyer_id', user.id)
        .eq('status', 'pending')

      if (checkError) throw checkError

      if (existingOffers && existingOffers.length > 0) {
        setError('You already have a pending offer for this listing')
        setSubmitting(false)
        return
      }

      // Create the offer
      const { data, error: insertError } = await supabase
        .from('offers')
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
          amount: amount,
          message: message.trim() || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Success - reset form and close immediately
      setOfferAmount('')
      setMessage('')
      onClose()

      // Notify parent after closing (parent will show toast)
      if (onOfferSubmitted) {
        onOfferSubmitted(data)
      }
    } catch (error) {
      console.error('Error submitting offer:', error)
      setError('Failed to submit offer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const suggestedOffer = Math.round(listing.price * 0.85) // 15% off

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Make an Offer</h2>
              <p className="text-sm text-gray-600 mt-1">{listing.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Listing Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Asking Price:</span>
              <span className="text-lg font-bold text-gray-900">{formatPrice(listing.price)}</span>
            </div>
            {listing.retail_price && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Retail Price:</span>
                <span className="text-sm text-gray-500 line-through">{formatPrice(listing.retail_price)}</span>
              </div>
            )}
          </div>

          {/* Offer Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Offer Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Suggested: {formatPrice(suggestedOffer)} (15% off)
            </p>
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message to the seller..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MakeOfferModal
