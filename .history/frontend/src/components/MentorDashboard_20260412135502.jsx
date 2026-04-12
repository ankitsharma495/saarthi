import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../services/api'
import LoadingSpinner from './LoadingSpinner'
import ErrorAlert from './ErrorAlert'

function StarRating({ value, onChange, readonly = false }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(v)}
          className={`text-lg transition ${
            v <= value ? 'text-yellow-400' : 'text-gray-300'
          } ${readonly ? 'cursor-default' : 'hover:scale-110 cursor-pointer'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function ReviewCard({ review, studentName, onGenerateSummary, isGenerating }) {
  const hasSummary = review.summary?.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
            {studentName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">{studentName}</span>
            <StarRating value={review.rating} readonly />
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-4">{review.reviewText}</p>

      {hasSummary && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-4 rounded-lg mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">✨</span>
            <p className="text-sm font-semibold text-indigo-700">AI Summary</p>
          </div>
          <ul className="space-y-1.5">
            {review.summary.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span className="text-sm text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hasSummary && (
        <button
          onClick={() => onGenerateSummary(review._id)}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition
            bg-gradient-to-r from-indigo-500 to-purple-500 text-white
            hover:from-indigo-600 hover:to-purple-600
            disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </>
          ) : (
            <>✨ Generate AI Summary</>
          )}
        </button>
      )}
    </div>
  )
}

export default function MentorDashboard() {
  const [students, setStudents] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedStudent, setSelectedStudent] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [rating, setRating] = useState(3)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState('')

  const [summarizing, setSummarizing] = useState(null)
  const [summaryError, setSummaryError] = useState('')

  const studentMap = useMemo(
    () => Object.fromEntries(students.map((s) => [s._id, s])),
    [students]
  )

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { data: studs } = await api.get('/students')
      setStudents(studs)

      const allReviews = []
      for (const s of studs) {
        try {
          const { data: revs } = await api.get(`/reviews/${s._id}`)
          allReviews.push(...revs)
        } catch {
          /* skip */
        }
      }
      setReviews(allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      setSubmitSuccess(`Review submitted for ${studentMap[selectedStudent]?.name || 'student'}`)
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
      setSummaryError(err.response?.data?.message || 'Failed to generate AI summary.')
    } finally {
      setSummarizing(null)
    }
  }

  if (loading) return <LoadingSpinner message="Loading dashboard..." />

  return (
    <div className="space-y-8">
      {error && <ErrorAlert message={error} onRetry={fetchData} />}

      {/* Stats Row */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Students</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{students.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Reviews</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{reviews.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 col-span-2 sm:col-span-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">AI Summaries</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {reviews.filter((r) => r.summary?.length > 0).length}
          </p>
        </div>
      </section>

      {/* Student List */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Students</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.course || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        s.status === 'active' ? 'bg-green-100 text-green-700'
                          : s.status === 'completed' ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {students.length === 0 && (
            <p className="text-center text-gray-400 py-8">No students found</p>
          )}
        </div>
      </section>

      {/* Add Review */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Submit Review</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
              <span>✓</span> {submitSuccess}
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  required
                >
                  <option value="">Select a student</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <StarRating value={rating} onChange={setRating} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Feedback
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-sm"
                placeholder="Write detailed feedback about the student's progress..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Review History ({reviews.length})
          </h2>

          {summaryError && (
            <div className="mb-4">
              <ErrorAlert message={summaryError} onRetry={() => setSummaryError('')} />
            </div>
          )}

          <div className="space-y-4">
            {reviews.map((review) => {
              const sid = review.studentId?._id || review.studentId
              const name = studentMap[sid]?.name || review.studentId?.name || 'Student'
              return (
                <ReviewCard
                  key={review._id}
                  review={review}
                  studentName={name}
                  onGenerateSummary={handleGenerateSummary}
                  isGenerating={summarizing === review._id}
                />
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
