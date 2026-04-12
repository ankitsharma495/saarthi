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
              {summaryResult && !summaryResult.summary && (
                <button
                  onClick={() => handleGenerateSummary(summaryResult.reviewId)}
                  disabled={summarizing === summaryResult.reviewId}
                  className="ml-2 text-indigo-600 hover:underline font-medium"
                >
                  {summarizing === summaryResult.reviewId
                    ? 'Generating...'
                    : '✨ Generate AI Summary'}
                </button>
              )}
            </div>
          )}

          {summaryResult?.summary && (
            <div className="bg-indigo-50 p-4 rounded-lg mb-4">
              <p className="text-sm font-medium text-indigo-700 mb-2">
                AI-Generated Summary:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {summaryResult.summary.map((point, i) => (
                  <li key={i} className="text-sm text-indigo-600">
                    {point}
                  </li>
                ))}
              </ul>
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
    </div>
  )
}
