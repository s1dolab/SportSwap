import { Link } from 'react-router-dom'
import { Youtube, Instagram, Facebook, Twitter } from 'lucide-react'

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          {/* Left: Logo + Slogan */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <img
                src="/images/logo/logo-wide.svg"
                alt="SportSwap"
                className="h-12 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-gray-400 leading-relaxed">
              Your trusted marketplace for buying, selling, renting, and exchanging sports equipment with local athletes.
            </p>
          </div>

          {/* Middle: Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition">
                  How it Works
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/browse" className="hover:text-white transition">
                  Browse Listings
                </Link>
              </li>
            </ul>
          </div>

          {/* Right: Social Media Icons */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition"
                aria-label="Youtube"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-sky-500 transition"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-400">
              Stay updated with the latest deals and sports equipment trends.
            </p>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left: Copyright */}
          <p className="text-sm text-gray-400">
            &copy; 2025 SportSwap. All rights reserved.
          </p>

          {/* Right: Legal Links */}
          <div className="flex space-x-6 text-sm">
            <Link to="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
            <Link to="/contact" className="hover:text-white transition">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
