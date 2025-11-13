import { Link } from 'react-router-dom'

function HomePage() {
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

      {/* Recently Added - Placeholder for now */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Recently Added</h2>
          <div className="text-center text-gray-500 py-12">
            Listings will appear here once you start adding products in Phase 2!
          </div>
        </div>
      </section>

      {/* Trending Searches */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">Trending Searches</h2>
        <div className="flex flex-wrap gap-3">
          {trendingSearches.map((search, index) => (
            <Link
              key={index}
              to={`/browse?q=${encodeURIComponent(search)}`}
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
