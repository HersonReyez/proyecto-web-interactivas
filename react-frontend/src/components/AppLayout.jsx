import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { errorMessage } from '../lib/api'
import { Avatar, Icon, Notice, RoleBadge } from './ui'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleLogout() {
    setBusy(true)
    setError('')
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  return <div className="app-layout">
    <aside className="sidebar">
      <Link className="brand" to="/"><span className="brand-mark"><Icon name="star" /></span>anime<span className="brand-thin">store</span><span className="brand-dot">.</span></Link>
      <div className="sidebar-section-label">{user.role === 'admin' ? 'ADMINISTRACIÓN' : 'MI ESPACIO'}</div>
      <nav className="side-nav" aria-label="Mi espacio">
        {user.role === 'admin' && <NavLink to="/admin/usuarios"><Icon name="users" />Usuarios <span className="nav-dot" /></NavLink>}
        <NavLink to="/mi-cuenta"><Icon name="user" />Mi perfil</NavLink>
        <Link to="/"><Icon name="store" />Inicio de la tienda <Icon name="arrow" size={16} /></Link>
      </nav>
      <div className="sidebar-note"><Icon name="star" size={28} /><strong>La comunidad empieza aquí.</strong><p>Cada cuenta es una nueva historia por descubrir.</p></div>
      <div className="sidebar-account"><Avatar user={user} /><div><strong>{user.name}</strong><small>{user.role === 'admin' ? 'Administrador' : 'Miembro de la comunidad'}</small></div></div>
      <button className="logout-button" onClick={handleLogout} disabled={busy}><Icon name="logout" />{busy ? 'Cerrando…' : 'Cerrar sesión'}</button>
    </aside>
    <div className="workspace">
      <header className="workspace-header"><span>Tu espacio / <strong>{user.role === 'admin' ? 'Administración' : 'Mi cuenta'}</strong></span><RoleBadge role={user.role} /></header>
      <main className="workspace-content"><Notice>{error}</Notice><Outlet /></main>
      <footer className="workspace-footer">Anime Store <span>Hecho para nuestra comunidad.</span></footer>
    </div>
  </div>
}
