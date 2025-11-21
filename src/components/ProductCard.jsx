import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

function ProductCard({ listing, onFavoriteChange, className }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if listing is favorited on mount
  useEffect(() => {
    if (user) {
      checkIfFavorited()
    }
  }, [user, listing.id])

  const checkIfFavorited = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', listing.id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setIsFavorited(true)
      }
    } catch (error) {
      // No favorite found, keep as false
      console.error('Error checking favorite:', error)
    }
  }

  const handleFavoriteClick = async (e) => {
    e.preventDefault() // Prevent navigation when clicking heart

    if (!user) {
      // Redirect to auth page if not logged in
      window.location.href = '/auth'
      return
    }

    if (loading) return // Prevent double clicks

    setLoading(true)

    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listing.id)

        if (error) throw error
        setIsFavorited(false)

        // Notify parent component
        if (onFavoriteChange) {
          onFavoriteChange(listing.id, false)
        }
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            listing_id: listing.id,
          })

        if (error) throw error
        setIsFavorited(true)

        // Notify parent component
        if (onFavoriteChange) {
          onFavoriteChange(listing.id, true)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get the first image or use a placeholder
  const imageUrl = listing.images?.[0]?.image_url || 'https://via.placeholder.com/300x300?text=No+Image'

  // Format price
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(listing.price)

  // Format retail price if exists
  const formattedRetailPrice = listing.retail_price
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
      }).format(listing.retail_price)
    : null

  // Calculate savings
  const savings = listing.retail_price
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
      }).format(listing.retail_price - listing.price)
    : null

  return (
    <div className={className}>
      <Link
        to={`/listings/${listing.id}`}
        className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
      >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={loading}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition z-10 disabled:opacity-50"
        >
          <svg
            className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'fill-none text-gray-600'}`}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {/* Listing Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
            {listing.listing_type === 'sale' ? 'For Sale' :
             listing.listing_type === 'rent' ? 'For Rent' : 'Exchange'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[3rem] group-hover:text-blue-600 transition">
          {listing.title}
        </h3>

        {/* Price */}
        <div className="mb-2">
          <div className="text-xl font-bold text-gray-900">
            {formattedPrice}
          </div>
          {formattedRetailPrice && (
            <div className="text-sm text-gray-500">
              Retail: <span className="line-through">{formattedRetailPrice}</span>
              <span className="text-green-600 ml-2">Save {savings}</span>
            </div>
          )}
        </div>

        {/* Condition */}
        <div className="text-sm text-gray-600 mb-2">
          Condition: <span className="font-medium">
            {listing.condition === 'new' ? 'New (with tags)' :
             listing.condition === 'like_new' ? 'Like New' :
             listing.condition === 'good' ? 'Good (minor wear)' :
             'Used (visible wear)'}
          </span>
        </div>

        {/* Seller */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-200">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              navigate(`/profile/${listing.profiles?.username || 'user'}`)
            }}
            className="flex items-center space-x-2 hover:text-blue-600 transition"
          >
            {listing.profiles?.profile_picture_url ? (
              <img
                src={listing.profiles.profile_picture_url}
                alt={listing.profiles.username}
                className="w-6 h-6 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <span className="text-sm text-gray-700">
              @{listing.profiles?.username || 'user'}
            </span>
          </button>

          {/* Location */}
          <div className="text-xs text-gray-500">
            {listing.city}
          </div>
        </div>
      </div>
      </Link>
    </div>
  )
}

export default ProductCard
