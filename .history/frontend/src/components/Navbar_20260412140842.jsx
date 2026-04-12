import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-indigo-600">
              MentorShip
            </Link>
            {user && (
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-indigo-600 transition"
              >
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-500">
                  {user.name}{' '}
                  <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 capitalize">
                    {user.role}
                  </span>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-red-600 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
