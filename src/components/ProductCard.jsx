import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

function ProductCard({ listing }) {
  const { user } = useAuth()
  const [isFavorited, setIsFavorited] = useState(false)

  const handleFavoriteClick = (e) => {
    e.preventDefault() // Prevent navigation when clicking heart

    if (!user) {
      // Redirect to auth page if not logged in
      window.location.href = '/auth'
      return
    }

    // Toggle favorite state (we'll implement actual saving to DB in Phase 3)
    setIsFavorited(!isFavorited)
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
    <Link
      to={`/listings/${listing.id}`}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
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
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition z-10"
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
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition">
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
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">
              @{listing.profiles?.username || 'user'}
            </span>
          </div>

          {/* Location */}
          <div className="text-xs text-gray-500">
            {listing.city}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
