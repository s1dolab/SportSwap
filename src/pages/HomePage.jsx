import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'

function HomePage() {
  const [recentListings, setRecentListings] = useState([])
  const [loading, setLoading] = useState(true)

  const categories = [
    { name: 'Basketball', slug: 'basketball', emoji: '🏀' },
    { name: 'Soccer', slug: 'soccer', emoji: '⚽' },
    { name: 'Swimming', slug: 'swimming', emoji: '🏊' },
    { name: 'Tennis', slug: 'tennis', emoji: '🎾' },
    { name: 'Volleyball', slug: 'volleyball', emoji: '🏐' },
  ]

  const trendingSearches = [
    'Used Football Cleats',
    'Tennis Racket',
    'Basketball Shoes',
    'Swimming Goggles',
    'Volleyball Net',
    'Soccer Ball',
    'Running Shoes',
    'Gym Equipment',
  ]

  // Fetch recent listings
  useEffect(() => {
    fetchRecentListings()
  }, [])

  const fetchRecentListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          listing_images(image_url, display_order),
          profiles:user_id(username, profile_picture_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(8)

      if (error) throw error

      // Format data to include images array
      const formattedData = data.map((listing) => ({
        ...listing,
        images: listing.listing_images.sort((a, b) => a.display_order - b.display_order),
      }))

      setRecentListings(formattedData)
    } catch (error) {
      console.error('Error fetching recent listings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Discover the best deals in sports
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Buy, sell, rent, or exchange sports equipment with athletes in your area
          </p>
          <Link
            to="/browse"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition text-lg"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Buy and sell with millions of athletes
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/browse?category=${category.slug}`}
              className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition text-center"
            >
              <div className="text-6xl mb-3">{category.emoji}</div>
              <h3 className="font-semibold text-lg">{category.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently Added */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Recently Added</h2>

          {loading ? (
            <div className="text-center text-gray-500 py-12">
              <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : recentListings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentListings.map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p className="mb-4">No listings yet. Be the first to post!</p>
              <Link
                to="/listings/new"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Create a Listing
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Trending Searches */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">Trending Searches</h2>
        <div className="flex flex-wrap gap-3">
          {trendingSearches.map((search, index) => (
            <Link
              key={index}
              to={`/browse?search=${encodeURIComponent(search)}`}
              className="px-4 py-2 bg-gray-200 hover:bg-blue-100 hover:text-blue-600 rounded-full text-sm font-medium transition"
            >
              {search}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
