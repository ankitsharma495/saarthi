import { useState, useEffect } from 'react'
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

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      // Find the student record linked to this user email
      const { data: students } = await api.get('/students')
      const myStudent = students.find(
        (s) => s.email === user.email
      )

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
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) return <LoadingSpinner message="Loading your progress..." />

  return (
    <div className="space-y-8">
      {error && <ErrorAlert message={error} onRetry={fetchData} />}

      {/* Student Info Card */}
      {studentInfo && (
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Your Profile
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-xs text-indigo-500 font-medium">Course</p>
              <p className="text-lg font-semibold text-indigo-700">
                {studentInfo.course}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-green-500 font-medium">Status</p>
              <p className="text-lg font-semibold text-green-700 capitalize">
                {studentInfo.status}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-xs text-purple-500 font-medium">Reviews</p>
              <p className="text-lg font-semibold text-purple-700">
                {reviews.length}
              </p>
            </div>
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
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Latest Review
          </h2>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  By {reviews[0].mentorId?.name || 'Mentor'}
                </span>
                <span className="text-yellow-400">
                  {'★'.repeat(reviews[0].rating)}
                  {'☆'.repeat(5 - reviews[0].rating)}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(reviews[0].createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {reviews[0].reviewText}
            </p>

            {reviews[0].summary && reviews[0].summary.length > 0 && (
              <div className="mt-4 bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-indigo-700 mb-2">
                  Key Takeaways:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {reviews[0].summary.map((point, i) => (
                    <li key={i} className="text-sm text-indigo-600">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* All Reviews */}
      {reviews.length > 1 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Review History
          </h2>
          <div className="space-y-4">
            {reviews.slice(1).map((review) => (
              <div
                key={review._id}
                className="bg-white rounded-xl shadow-sm p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-yellow-400 text-sm">
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{review.reviewText}</p>

                {review.summary && review.summary.length > 0 && (
                  <div className="mt-3 bg-indigo-50 p-3 rounded-lg">
                    <ul className="list-disc list-inside space-y-0.5">
                      {review.summary.map((point, i) => (
                        <li key={i} className="text-xs text-indigo-600">
                          {point}
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
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No reviews yet</p>
          <p className="text-sm">Your mentor will add reviews as you progress</p>
        </div>
      )}
    </div>
  )
}
