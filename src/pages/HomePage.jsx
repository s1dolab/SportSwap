import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import { Camera, MessageCircle, Handshake, Github, Code, Database, Palette } from 'lucide-react'

function HomePage() {
  const [recentListings, setRecentListings] = useState([])
  const [loading, setLoading] = useState(true)

  const categories = [
    {
      name: 'Basketball',
      slug: 'basketball',
      image: '/images/categories/basketball.jpg'
    },
    {
      name: 'Soccer',
      slug: 'soccer',
      image: '/images/categories/soccer.jpg'
    },
    {
      name: 'Swimming',
      slug: 'swimming',
      image: '/images/categories/swimming.jpg'
    },
    {
      name: 'Tennis',
      slug: 'tennis',
      image: '/images/categories/tennis.jpg'
    },
    {
      name: 'Volleyball',
      slug: 'volleyball',
      image: '/images/categories/volleyball.jpg'
    },
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
        .limit(15)

      if (error) throw error

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
      {/* Hero Section - 2 Column with Animation */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Discover the best deals in sports
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-gray-600 mb-8"
              >
                Buy, sell, rent, or exchange sports equipment with athletes in your area.
                Join thousands of sports enthusiasts finding great deals every day.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link
                  to="/browse"
                  className="inline-block bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Shop Now
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80"
                alt="Sports Equipment"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="text-3xl font-bold text-blue-600">15K+</div>
                <div className="text-gray-600">Active Listings</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Shop by Category - Image-based Cards */}
      <section className="container mx-auto px-4 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-12"
        >
          Shop by Category
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link
                to={`/browse?category=${category.slug}`}
                className="group block relative aspect-square rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white font-bold text-xl text-center">{category.name}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recently Added - Fixed Alignment */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <Link to="/browse" className="hover:text-blue-600 transition">
              <h2 className="text-4xl font-bold">Recently Added</h2>
            </Link>
            <Link
              to="/browse"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
            >
              <span>View All</span>
              <span>→</span>
            </Link>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-12">
              <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : recentListings.length > 0 ? (
            <div className="flex overflow-x-auto gap-3 snap-x scrollbar-hide px-4 pb-6">
              {recentListings.map((listing) => (
                <ProductCard
                  key={listing.id}
                  listing={listing}
                  className="w-64 flex-shrink-0 snap-start"
                />
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

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-16"
        >
          How It Works
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4">List Your Gear</h3>
            <p className="text-gray-600 text-lg">
              Snap a photo and set your price. Create a listing in minutes and reach local buyers instantly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Connect</h3>
            <p className="text-gray-600 text-lg">
              Chat with locals to negotiate. Our built-in messaging makes communication simple and secure.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Handshake className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Trade</h3>
            <p className="text-gray-600 text-lg">
              Meet up to buy, sell, or swap. Complete your transaction safely in your local community.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack - Under the Hood */}
      <section id="tech-stack" className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-4"
          >
            Under the Hood
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center text-gray-400 mb-16 text-lg"
          >
            Built with modern technologies for performance and scalability
          </motion.p>
          <div className="grid md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-8 hover:bg-white/10 transition border border-white/10"
            >
              <div className="bg-blue-500/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Code className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">React & Vite</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Modern component architecture with lightning-fast Hot Module Replacement for optimal development experience.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-8 hover:bg-white/10 transition border border-white/10"
            >
              <div className="bg-green-500/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Database className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Supabase</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Real-time database with PostgreSQL, authentication, and row-level security for scalable data management.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-8 hover:bg-white/10 transition border border-white/10"
            >
              <div className="bg-purple-500/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Palette className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Tailwind CSS</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Utility-first CSS framework enabling rapid UI development with a fully responsive design system.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-8 hover:bg-white/10 transition border border-white/10"
            >
              <div className="bg-gray-500/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Github className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold mb-3">Open Source</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Full source code available on GitHub. Check out the implementation and contribute to the project.
              </p>
              <a
                href="https://github.com/s1dolab/SportSwap"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition"
              >
                <span className="text-sm font-medium">View on GitHub</span>
                <span>→</span>
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
