import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { Login } from './pages/auth/Login'
import { Signup } from './pages/auth/Signup'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { AnamnesisForm } from './pages/anamnesis/AnamnesisForm'
import { PaymentPage } from './pages/payment/PaymentPage'
import { PlanPage } from './pages/plan/PlanPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/entrar" replace />} />

          <Route path="/entrar" element={<Login />} />
          <Route path="/cadastro" element={<Signup />} />
          <Route path="/esqueci-minha-senha" element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />

          <Route
            path="/painel"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/anamnese"
            element={
              <ProtectedRoute>
                <AnamnesisForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pagamento/:anamnesisId"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/plano/:paymentId"
            element={
              <ProtectedRoute>
                <PlanPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/entrar" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
