import { useAuth } from '../context/AuthContext'
import MentorDashboard from '../components/MentorDashboard'
import StudentDashboard from '../components/StudentDashboard'

export default function Dashboard() {
  const { user } = useAuth()
  const isMentor = user.role === 'mentor'

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user.name}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isMentor
              ? 'Manage your students and submit reviews'
              : 'Track your progress and view feedback'}
          </p>
        </div>
        <span className={`self-start inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${
          isMentor ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isMentor ? 'bg-indigo-500' : 'bg-green-500'}`} />
          {isMentor ? 'Mentor' : 'Student'}
        </span>
      </div>

      {isMentor ? <MentorDashboard /> : <StudentDashboard />}
    </div>
  )
}
