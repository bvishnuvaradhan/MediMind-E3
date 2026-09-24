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
  const { isAuthenticated, loading, role } = useAuth()
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

  if (!isAuthenticated) {
    return authMode === 'signup' ? (
      <SignupPage onSwitchToLogin={() => setAuthMode('login')} />
    ) : (
      <LoginPage onSwitchToSignup={() => setAuthMode('signup')} />
    )
  }

  if (role === 'CHAIRMAN') {
    return <ChairmanLayout dark={dark} setDark={setDark} />
  }

  if (role === 'HOSPITAL_ADMIN') {
    return <HospitalAdminLayout dark={dark} setDark={setDark} />
  }

  if (role === 'DEPARTMENT_HEAD') {
    return <DepartmentHeadLayout dark={dark} setDark={setDark} />
  }

  if (role === 'DOCTOR') {
    return <DoctorLayout dark={dark} setDark={setDark} />
  }

  return <FamilyLayout dark={dark} setDark={setDark} />
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  )
}
