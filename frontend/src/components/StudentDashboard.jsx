import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import LoadingSpinner from './LoadingSpinner'
import ErrorAlert from './ErrorAlert'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [studentInfo, setStudentInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const { data: students } = await api.get('/students')
      const myStudent = students.find((s) => s.email === user.email)

      if (myStudent) {
        setStudentInfo(myStudent)
        const { data: revs } = await api.get(`/reviews/${myStudent._id}`)
        setReviews(revs)
      } else {
        setStudentInfo(null)
        setReviews([])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }, [user.email])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '—'

  if (loading) return <LoadingSpinner message="Loading your progress..." />

  return (
    <div className="space-y-8">
      {error && <ErrorAlert message={error} onRetry={fetchData} />}

      {/* Profile + Stats */}
      {studentInfo && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Course</p>
            <p className="text-lg font-bold text-gray-800 mt-1">{studentInfo.course || '—'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</p>
            <p className="text-lg font-bold text-green-600 mt-1 capitalize">{studentInfo.status}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Reviews</p>
            <p className="text-lg font-bold text-gray-800 mt-1">{reviews.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Avg Rating</p>
            <p className="text-lg font-bold text-yellow-500 mt-1">{avgRating} ★</p>
          </div>
        </section>
      )}

      {!studentInfo && !error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
          No student profile found for your account. Please contact your mentor.
        </div>
      )}

      {/* Latest Review */}
      {reviews.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Latest Review</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                  {reviews[0].mentorId?.name?.charAt(0)?.toUpperCase() || 'M'}
                </div>
                <div>
                  <span className="text-sm text-gray-600">
                    {reviews[0].mentorId?.name || 'Mentor'}
                  </span>
                  <div className="text-yellow-400 text-sm">
                    {'★'.repeat(reviews[0].rating)}
                    {'☆'.repeat(5 - reviews[0].rating)}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(reviews[0].createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed">{reviews[0].reviewText}</p>

            {reviews[0].summary?.length > 0 && (
              <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span>✨</span>
                  <p className="text-sm font-semibold text-indigo-700">Key Takeaways</p>
                </div>
                <ul className="space-y-1.5">
                  {reviews[0].summary.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                      <span className="text-sm text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Review History */}
      {reviews.length > 1 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Review History</h2>
          <div className="space-y-4">
            {reviews.slice(1).map((review) => (
              <div key={review._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-yellow-400 text-sm">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{review.reviewText}</p>

                {review.summary?.length > 0 && (
                  <div className="mt-3 bg-indigo-50 border border-indigo-100 p-3 rounded-lg">
                    <ul className="space-y-1">
                      {review.summary.map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                          <span className="text-xs text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {reviews.length === 0 && studentInfo && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-lg text-gray-500 font-medium">No reviews yet</p>
          <p className="text-sm text-gray-400 mt-1">Your mentor will add reviews as you progress</p>
        </div>
      )}
    </div>
  )
}
