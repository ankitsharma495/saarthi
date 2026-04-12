import { useAuth } from '../context/AuthContext'
import MentorDashboard from '../components/MentorDashboard'
import StudentDashboard from '../components/StudentDashboard'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {user.name}
        </h1>
        <p className="text-gray-500 mt-1">
          {user.role === 'mentor'
            ? 'Manage your students and submit reviews'
            : 'Track your progress and view feedback'}
        </p>
      </div>

      {user.role === 'mentor' ? <MentorDashboard /> : <StudentDashboard />}
    </div>
  )
}
