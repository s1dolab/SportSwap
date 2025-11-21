import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import ComingSoon from './pages/ComingSoon'
import AuthPage from './pages/AuthPage'
import CreateListingPage from './pages/CreateListingPage'
import BrowsePage from './pages/BrowsePage'
import ListingDetailPage from './pages/ListingDetailPage'
import FavoritesPage from './pages/FavoritesPage'
import PublicProfilePage from './pages/PublicProfilePage'
import MessagesPage from './pages/MessagesPage'
import DashboardLayout from './components/DashboardLayout'
import MyListingsPage from './pages/MyListingsPage'
import MyOffersPage from './pages/MyOffersPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import AccountSettingsPage from './pages/AccountSettingsPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/listings/new" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
            <Route path="/listings/:id/edit" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
            <Route path="/profile/:username" element={<PublicProfilePage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="listings" element={<MyListingsPage />} />
              <Route path="offers" element={<MyOffersPage />} />
              <Route path="history" element={<OrderHistoryPage />} />
              <Route path="settings" element={<AccountSettingsPage />} />
            </Route>
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
