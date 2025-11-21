import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import FilterSection from '../components/FilterSection'

function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Filter states
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [subcategories, setSubcategories] = useState([])
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [listingTypes, setListingTypes] = useState([])
  const [conditions, setConditions] = useState([])
  const [locations, setLocations] = useState([])
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')
  const [page, setPage] = useState(1)
  const itemsPerPage = 32

  // Subcategories mapping
  const categorySubcategories = {
    basketball: [
      { value: 'shoes', label: 'Shoes' },
      { value: 'jerseys', label: 'Jerseys' },
      { value: 'balls', label: 'Balls' },
      { value: 'accessories', label: 'Accessories' }
    ],
    soccer: [
      { value: 'cleats', label: 'Cleats' },
      { value: 'jerseys', label: 'Jerseys' },
      { value: 'balls', label: 'Balls' },
      { value: 'shin_guards', label: 'Shin Guards' }
    ],
    swimming: [
      { value: 'goggles', label: 'Goggles' },
      { value: 'swimsuits', label: 'Swimsuits' },
      { value: 'caps', label: 'Caps' },
      { value: 'accessories', label: 'Accessories' }
    ],
    tennis: [
      { value: 'rackets', label: 'Rackets' },
      { value: 'balls', label: 'Balls' },
      { value: 'shoes', label: 'Shoes' },
      { value: 'apparel', label: 'Apparel' }
    ],
    volleyball: [
      { value: 'balls', label: 'Balls' },
      { value: 'nets', label: 'Nets' },
      { value: 'knee_pads', label: 'Knee Pads' },
      { value: 'shoes', label: 'Shoes' }
    ],
    other: [
      { value: 'general', label: 'General' },
      { value: 'accessories', label: 'Accessories' },
      { value: 'training_equipment', label: 'Training Equipment' }
    ]
  }

  // Update state when URL params change
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '')
    setCategory(searchParams.get('category') || '')
    setMinPrice(searchParams.get('minPrice') || '')
    setMaxPrice(searchParams.get('maxPrice') || '')
    setSortBy(searchParams.get('sort') || 'newest')
  }, [searchParams])

  // Fetch listings
  useEffect(() => {
    fetchListings()
  }, [category, subcategories, searchQuery, minPrice, maxPrice, listingTypes, conditions, locations, sortBy, page])

  const fetchListings = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('listings')
        .select(`
          *,
          listing_images(image_url, display_order),
          profiles:user_id(username, profile_picture_url)
        `, { count: 'exact' })
        .eq('status', 'active')

      // Apply filters
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
      }

      if (category) {
        query = query.eq('category', category)
      }

      if (subcategories.length > 0) {
        query = query.in('subcategory', subcategories)
      }

      if (minPrice) {
        query = query.gte('price', parseFloat(minPrice))
      }

      if (maxPrice) {
        query = query.lte('price', parseFloat(maxPrice))
      }

      if (listingTypes.length > 0) {
        query = query.in('listing_type', listingTypes)
      }

      if (conditions.length > 0) {
        query = query.in('condition', conditions)
      }

      if (locations.length > 0) {
        query = query.in('city', locations)
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }

      // Pagination
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      // Format data to include images array
      const formattedData = data.map((listing) => ({
        ...listing,
        images: listing.listing_images.sort((a, b) => a.display_order - b.display_order),
      }))

      setListings(formattedData)
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckbox = (value, state, setState) => {
    if (state.includes(value)) {
      setState(state.filter((item) => item !== value))
    } else {
      setState([...state, value])
    }
  }

  const applyPriceFilter = () => {
    // Update URL params
    const params = new URLSearchParams(searchParams)
    if (minPrice) params.set('minPrice', minPrice)
    else params.delete('minPrice')
    if (maxPrice) params.set('maxPrice', maxPrice)
    else params.delete('maxPrice')
    setSearchParams(params)
    setPage(1)
  }

  const clearFilters = () => {
    setCategory('')
    setSubcategories([])
    setSearchQuery('')
    setMinPrice('')
    setMaxPrice('')
    setListingTypes([])
    setConditions([])
    setLocations([])
    setSearchParams({})
    setPage(1)
  }

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory)
    setSubcategories([]) // Clear subcategories when category changes
    setPage(1)
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          {searchQuery ? (
            <div>
              <h1 className="text-3xl font-bold">
                Search results for: <span className="text-blue-600">"{searchQuery}"</span>
              </h1>
              <p className="text-gray-600 mt-2">
                Showing results matching your search
              </p>
            </div>
          ) : category ? (
            <div>
              <h1 className="text-3xl font-bold capitalize">
                {category} Equipment
              </h1>
              <p className="text-gray-600 mt-2">
                Find deals on shoes, jerseys, balls, and more
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold">Browse All Listings</h1>
              <p className="text-gray-600 mt-2">
                Discover sports equipment from athletes in your area
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filter Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </button>
              </div>

              <div>
                {/* Category */}
                <FilterSection title="Category">
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={category === ''}
                        onChange={() => handleCategoryChange('')}
                        className="mr-2"
                      />
                      <span>All Categories</span>
                    </label>
                    {['basketball', 'soccer', 'swimming', 'tennis', 'volleyball', 'other'].map((cat) => (
                      <label key={cat} className="flex items-center">
                        <input
                          type="radio"
                          checked={category === cat}
                          onChange={() => handleCategoryChange(cat)}
                          className="mr-2"
                        />
                        <span className="capitalize">{cat}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                {/* Subcategories - Show only when a category is selected */}
                {category && categorySubcategories[category] && (
                  <FilterSection title="Subcategory">
                    <div className="space-y-2">
                      {categorySubcategories[category].map((subcat) => (
                        <label key={subcat.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={subcategories.includes(subcat.value)}
                            onChange={() => handleCheckbox(subcat.value, subcategories, setSubcategories)}
                            className="mr-2"
                          />
                          <span className="text-sm">{subcat.label}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>
                )}

                {/* Price */}
                <FilterSection title="Price (€)">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={applyPriceFilter}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-sm"
                    >
                      Apply
                    </button>
                  </div>
                </FilterSection>

                {/* Listing Type */}
                <FilterSection title="Listing Type">
                  <div className="space-y-2">
                    {[
                      { value: 'sale', label: 'For Sale' },
                      { value: 'rent', label: 'For Rent' },
                      { value: 'exchange', label: 'For Exchange' },
                    ].map((type) => (
                      <label key={type.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={listingTypes.includes(type.value)}
                          onChange={() => handleCheckbox(type.value, listingTypes, setListingTypes)}
                          className="mr-2"
                        />
                        <span>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                {/* Condition */}
                <FilterSection title="Condition">
                  <div className="space-y-2">
                    {[
                      { value: 'new', label: 'New (with tags)' },
                      { value: 'like_new', label: 'Like New' },
                      { value: 'good', label: 'Good (minor wear)' },
                      { value: 'used', label: 'Used (visible wear)' },
                    ].map((cond) => (
                      <label key={cond.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={conditions.includes(cond.value)}
                          onChange={() => handleCheckbox(cond.value, conditions, setConditions)}
                          className="mr-2"
                        />
                        <span className="text-sm">{cond.label}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                {/* Location */}
                <FilterSection title="Location">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {[
                      'Rīga', 'Daugavpils', 'Liepāja', 'Jelgava', 'Jūrmala', 'Ventspils',
                      'Rēzekne', 'Valmiera', 'Jēkabpils', 'Ogre', 'Salaspils', 'Tukums',
                      'Cēsis', 'Sigulda', 'Olaine', 'Kuldīga'
                    ].map((city) => (
                      <label key={city} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={locations.includes(city)}
                          onChange={() => handleCheckbox(city, locations, setLocations)}
                          className="mr-2"
                        />
                        <span className="text-sm">{city}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Controls Row */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {listings.length === 0 ? 0 : (page - 1) * itemsPerPage + 1}-
                {Math.min(page * itemsPerPage, totalCount)} of {totalCount} results
              </div>

              <div className="flex items-center space-x-4">
                <label className="text-sm text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value)
                    setPage(1)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 mt-4">Loading listings...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search criteria</p>
                <Link
                  to="/listings/new"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Create a Listing
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {listings.map((listing) => (
                    <ProductCard key={listing.id} listing={listing} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => setPage(pageNum)}
                            className={`px-4 py-2 rounded-lg ${
                              page === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}

                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default BrowsePage
