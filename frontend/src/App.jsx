import { useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { LoginPage, SignupPage } from './components/auth/AuthPages'
import { ChairmanLayout } from './components/chairman/ChairmanLayout'
import { HospitalAdminLayout } from './components/hospital-admin/HospitalAdminLayout'
import { DepartmentHeadLayout } from './components/department-head/DepartmentHeadLayout'
import { DoctorLayout } from './components/doctor/DoctorLayout'
import { FamilyLayout } from './components/family/FamilyLayout'

function MainRouter() {
  const { isAuthenticated, loading, role, user } = useAuth()
  const [authMode, setAuthMode] = useState('login')
  const [dark, setDark] = useState(false)

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-spinner" />
        <p>Restoring MediMind session...</p>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return authMode === 'signup' ? (
      <SignupPage onSwitchToLogin={() => setAuthMode('login')} />
    ) : (
      <LoginPage onSwitchToSignup={() => setAuthMode('signup')} />
    )
  }

  const userKey = user?.id || user?.userId || user?.email || role || 'unknown';

  if (role === 'CHAIRMAN') {
    return <ChairmanLayout key={`chairman-${userKey}`} dark={dark} setDark={setDark} />
  }

  if (role === 'HOSPITAL_ADMIN') {
    return <HospitalAdminLayout key={`hadmin-${userKey}`} dark={dark} setDark={setDark} />
  }

  if (role === 'DEPARTMENT_HEAD') {
    return <DepartmentHeadLayout key={`depthead-${userKey}`} dark={dark} setDark={setDark} />
  }

  if (role === 'DOCTOR') {
    return <DoctorLayout key={`doctor-${userKey}`} dark={dark} setDark={setDark} />
  }

  if (role === 'FAMILY') {
    return <FamilyLayout key={`family-${userKey}`} dark={dark} setDark={setDark} />
  }

  return <LoginPage onSwitchToSignup={() => setAuthMode('signup')} />
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  )
}
