import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'

function FavoritesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    fetchFavorites()
  }, [user])

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          listing_id,
          listings (
            *,
            listing_images(image_url, display_order),
            profiles:user_id(username, profile_picture_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Format data
      const formattedFavorites = data
        .filter(fav => fav.listings) // Filter out deleted listings
        .map((fav) => ({
          ...fav.listings,
          images: fav.listings.listing_images.sort((a, b) => a.display_order - b.display_order),
        }))

      setFavorites(formattedFavorites)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFavoriteChange = (listingId, isFavorited) => {
    // If unfavorited, remove from local state immediately
    if (!isFavorited) {
      setFavorites(favorites.filter(fav => fav.id !== listingId))
    }
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
          <p className="text-gray-600">
            {favorites.length === 0
              ? 'You haven\'t saved any listings yet'
              : `${favorites.length} ${favorites.length === 1 ? 'listing' : 'listings'} saved`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Loading your favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-6">
              Start saving listings by clicking the heart icon on any product
            </p>
            <Link
              to="/browse"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((listing) => (
              <ProductCard key={listing.id} listing={listing} onFavoriteChange={handleFavoriteChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FavoritesPage
