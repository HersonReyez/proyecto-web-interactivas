import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import AppLayout from './components/AppLayout'
import Login from './components/Login'
import Register from './components/Register'
import Profile from './components/Profile'
import Users from './components/Users'
import VisitorHome from './components/VisitorHome'
import { Loading, Notice } from './components/ui'
import './App.css'

function Protected({ admin = false }) {
  const { user, loading, error, refresh } = useAuth()
  const location = useLocation()
  if (loading) return <Loading text="Comprobando tu sesión…" />
  if (error) return <div className="standalone-state"><Notice>{error}</Notice><button className="button primary" onClick={refresh}>Reintentar conexión</button><Link to="/">Volver al inicio</Link></div>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (admin && user.role !== 'admin') return <div className="standalone-state"><span className="eyebrow">ACCESO RESTRINGIDO</span><h1>Este espacio es del equipo.</h1><p>Tu cuenta de cliente no tiene permisos de administración.</p><Link className="button primary" to="/mi-cuenta">Ir a mi perfil</Link></div>
  return <Outlet />
}

function GuestOnly() {
  const { user, loading } = useAuth()
  if (loading) return <Loading text="Comprobando tu sesión…" />
  return user ? <Navigate to={user.role === 'admin' ? '/admin/usuarios' : '/mi-cuenta'} replace /> : <Outlet />
}

export default function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/" element={<VisitorHome />} />
    <Route element={<GuestOnly />}><Route path="/login" element={<Login />} /><Route path="/registro" element={<Register />} /><Route path="/register" element={<Navigate to="/registro" replace />} /></Route>
    <Route element={<Protected />}><Route element={<AppLayout />}><Route path="/mi-cuenta" element={<Profile />} /><Route element={<Protected admin />}><Route path="/admin/usuarios" element={<Users />} /></Route></Route></Route>
    <Route path="*" element={<div className="standalone-state"><span className="eyebrow">404 / CAPÍTULO NO ENCONTRADO</span><h1>Esta página no existe.</h1><Link className="button primary" to="/">Volver al inicio</Link></div>} />
  </Routes></AuthProvider></BrowserRouter>
}
