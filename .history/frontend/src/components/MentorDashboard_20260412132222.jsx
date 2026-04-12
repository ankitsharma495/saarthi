import { useState, useEffect } from 'react'
import api from '../services/api'
import LoadingSpinner from './LoadingSpinner'
import ErrorAlert from './ErrorAlert'

export default function MentorDashboard() {
  const [students, setStudents] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Review form state
  const [selectedStudent, setSelectedStudent] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [rating, setRating] = useState(3)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState('')

  // AI Summary state
  const [summarizing, setSummarizing] = useState(null)
  const [summaryError, setSummaryError] = useState('')

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError('')
      const { data } = await api.get('/students')
      setStudents(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async (studentId) => {
    try {
      const { data } = await api.get(`/reviews/${studentId}`)
      return data
    } catch {
      return []
    }
  }

  // Fetch all reviews for all students
  const fetchAllReviews = async (studentsList) => {
    const allReviews = []
    for (const s of studentsList) {
      const revs = await fetchReviews(s._id)
      allReviews.push(...revs)
    }
    setReviews(allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/students')
        setStudents(data)
        await fetchAllReviews(data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!selectedStudent || !reviewText) return

    setSubmitting(true)
    setSubmitSuccess('')
    setError('')

    try {
      const { data } = await api.post('/reviews', {
        studentId: selectedStudent,
        reviewText,
        rating: Number(rating),
      })

      setSubmitSuccess(`Review submitted for ${data.studentId?.name || 'student'}`)
      setReviews((prev) => [data, ...prev])
      setReviewText('')
      setRating(3)
      setSelectedStudent('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerateSummary = async (reviewId) => {
    setSummarizing(reviewId)
    setSummaryError('')

    try {
      const { data } = await api.post(`/reviews/${reviewId}/summary`)
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, summary: data.summary } : r))
      )
    } catch (err) {
      setSummaryError(
        err.response?.data?.message || 'Failed to generate AI summary. Check your Gemini API key.'
      )
    } finally {
      setSummarizing(null)
    }
  }

  if (loading) return <LoadingSpinner message="Loading students..." />

  return (
    <div className="space-y-8">
      {error && <ErrorAlert message={error} onRetry={fetchStudents} />}

      {/* Student List */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Student List ({students.length})
        </h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {student.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {student.course}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        student.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : student.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && (
            <p className="text-center text-gray-400 py-8">No students found</p>
          )}
        </div>
      </section>

      {/* Add Review Form */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Add Review</h2>
        <div className="bg-white rounded-xl shadow-sm p-6">
          {submitSuccess && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">
              {submitSuccess}
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select a student</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} — {s.course}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRating(val)}
                    className={`w-10 h-10 rounded-lg font-medium transition ${
                      rating >= val
                        ? 'bg-yellow-400 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review (detailed feedback)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                placeholder="Write detailed feedback about the student's progress, strengths, and areas for improvement..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </section>

      {/* Review History with AI Summary */}
      {reviews.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Recent Reviews ({reviews.length})
          </h2>

          {summaryError && (
            <div className="mb-4">
              <ErrorAlert message={summaryError} onRetry={() => setSummaryError('')} />
            </div>
          )}

          <div className="space-y-4">
            {reviews.map((review) => {
              const student = students.find((s) => s._id === (review.studentId?._id || review.studentId))
              const hasSummary = review.summary && review.summary.length > 0
              const isGenerating = summarizing === review._id

              return (
                <div key={review._id} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {student?.name || review.studentId?.name || 'Student'}
                      </span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-yellow-400 text-sm">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {review.reviewText}
                  </p>

                  {/* AI Summary Display */}
                  {hasSummary && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-4 rounded-lg mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">✨</span>
                        <p className="text-sm font-semibold text-indigo-700">
                          AI Summary
                        </p>
                      </div>
                      <ul className="space-y-2">
                        {review.summary.map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                            <span className="text-sm text-gray-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Generate AI Summary Button */}
                  {!hasSummary && (
                    <button
                      onClick={() => handleGenerateSummary(review._id)}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition
                        bg-gradient-to-r from-indigo-500 to-purple-500 text-white
                        hover:from-indigo-600 hover:to-purple-600
                        disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Generating Summary...
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          Generate AI Summary
                        </>
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
