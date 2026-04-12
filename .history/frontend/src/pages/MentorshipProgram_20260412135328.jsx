import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const features = [
  {
    icon: '🎯',
    title: '1-on-1 Guidance',
    desc: 'Get paired with an experienced mentor who provides personalized feedback on your progress.',
  },
  {
    icon: '🤖',
    title: 'AI-Powered Insights',
    desc: 'Receive AI-generated summaries of mentor reviews highlighting key action items.',
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    desc: 'Monitor your growth with a dedicated dashboard showing reviews, ratings, and milestones.',
  },
  {
    icon: '🚀',
    title: 'Career Acceleration',
    desc: 'Build real-world skills with structured mentorship designed to fast-track your goals.',
  },
]

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + i)

export default function MentorshipProgram() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    targetYear: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const { data } = await api.post('/applications', {
        ...formData,
        targetYear: Number(formData.targetYear),
      })
      setSuccess(data.message || 'Application submitted successfully!')
      setFormData({ name: '', email: '', phone: '', targetYear: '' })
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center py-12">
        <span className="inline-block px-4 py-1.5 text-sm font-medium bg-indigo-100 text-indigo-700 rounded-full mb-6">
          Applications Open
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          Accelerate Your Growth with <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            Expert Mentorship
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-500 mb-8">
          Join our mentorship program and get paired with industry professionals who
          will guide you through personalized reviews, AI-powered insights, and
          structured learning paths.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="#apply"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            Apply Now <span aria-hidden>→</span>
          </a>
          <Link
            to="/login"
            className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
          >
            Already enrolled? Log in
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-10">
          Why Join Our Program?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-base font-semibold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="max-w-lg mx-auto scroll-mt-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Apply Now</h2>
          <p className="text-gray-500 text-sm">
            Fill in your details and we'll match you with the right mentor.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm mb-6 flex items-start gap-3">
              <span className="text-lg leading-none">✓</span>
              <div>
                <p className="font-medium">{success}</p>
                <button
                  onClick={() => setSuccess('')}
                  className="text-green-600 hover:underline text-xs mt-1"
                >
                  Submit another application
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Year
                </label>
                <select
                  name="targetYear"
                  value={formData.targetYear}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  required
                >
                  <option value="">Select target year</option>
                  {yearOptions.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
