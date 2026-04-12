import { useState } from 'react'

export default function MentorshipProgram() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    course: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, this would POST to an API
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="bg-green-50 p-8 rounded-xl">
          <svg
            className="w-16 h-16 text-green-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Application Submitted!
          </h2>
          <p className="text-green-600">
            Thank you, {formData.name}. We'll be in touch soon.
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              setFormData({ name: '', email: '', course: '', message: '' })
            }}
            className="mt-4 text-indigo-600 hover:underline text-sm"
          >
            Submit another application
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Mentorship Program
        </h1>
        <p className="text-gray-500">
          Join our mentorship program and accelerate your learning journey
        </p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-md">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Course
            </label>
            <select
              name="course"
              value={formData.course}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              required
            >
              <option value="">Select a course</option>
              <option value="Full Stack Development">Full Stack Development</option>
              <option value="React & Node">React & Node</option>
              <option value="Python for Data Science">Python for Data Science</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="DevOps Engineering">DevOps Engineering</option>
              <option value="Mobile App Dev">Mobile App Dev</option>
              <option value="Cloud Computing">Cloud Computing</option>
              <option value="Cybersecurity Fundamentals">Cybersecurity Fundamentals</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Why do you want to join?
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Apply Now
          </button>
        </form>
      </div>
    </div>
  )
}
