import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './components/ui'
import AppLayout from './layout/AppLayout'
import { AuthProvider } from './lib/auth'
import Assignments from './pages/Assignments'
import Batches from './pages/Batches'
import Brokers from './pages/Brokers'
import CourseDetail from './pages/CourseDetail'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Drivers from './pages/Drivers'
import Loads from './pages/Loads'
import Login from './pages/Login'
import Negotiation from './pages/Negotiation'
import Notifications from './pages/Notifications'
import RateInsights from './pages/RateInsights'
import Reports from './pages/Reports'
import Reviews from './pages/Reviews'
import Roles from './pages/Roles'
import Scenarios from './pages/Scenarios'
import Scoring from './pages/Scoring'
import Settings from './pages/Settings'
import Shippers from './pages/Shippers'
import StudentDetail from './pages/StudentDetail'
import Students from './pages/Students'
import Training from './pages/Training'
import Trucks from './pages/Trucks'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="students/:id" element={<StudentDetail />} />
              <Route path="roles" element={<Roles />} />
              <Route path="batches" element={<Batches />} />
              <Route path="training" element={<Training />} />
              <Route path="training/:courseId" element={<CourseDetail />} />
              <Route path="scenarios" element={<Scenarios />} />
              <Route path="loads" element={<Loads />} />
              <Route path="rate-insights" element={<RateInsights />} />
              <Route path="trucks" element={<Trucks />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="brokers" element={<Brokers />} />
              <Route path="shippers" element={<Shippers />} />
              <Route path="negotiation" element={<Negotiation />} />
              <Route path="documents" element={<Documents />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="scoring" element={<Scoring />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="reports" element={<Reports />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
