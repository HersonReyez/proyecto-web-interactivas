import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api, errorMessage } from '../lib/api'
import { Avatar, Icon, Loading, Notice, RoleBadge } from './ui'
import Modal from './Modal'
import UserForm from './UserForm'

export default function Users() {
  const { user, refresh } = useAuth()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ search: '', role: '', page: 1 })
  const [revision, setRevision] = useState(0)
  const [editor, setEditor] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    api.get('/users', { params: filters, signal: controller.signal }).then(({ data }) => {
      if (data.current_page > data.last_page) {
        setFilters(previous => ({ ...previous, page: data.last_page }))
      } else {
        setResult(data)
      }
    }).catch(failure => {
      if (controller.signal.aborted) return
      if (failure.response?.status === 403) refresh()
      setError(errorMessage(failure))
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [filters, revision, refresh])

  function saved(message) {
    setEditor(null)
    setSuccess(message)
    setRevision(value => value + 1)
  }

  async function removeUser() {
    setDeleteBusy(true)
    setDeleteError('')
    try {
      const { data } = await api.delete('/users/' + deleting.id)
      setDeleting(null)
      setSuccess(data.message)
      setRevision(value => value + 1)
    } catch (failure) {
      setDeleteError(failure.response?.data?.errors?.user?.[0] || errorMessage(failure))
    } finally {
      setDeleteBusy(false)
    }
  }

  return <>
    <div className="page-heading"><div><span className="eyebrow">PERSONAS QUE DAN VIDA A LA TIENDA</span><h1>Usuarios<span>.</span></h1><p>Gestiona tu comunidad, una cuenta a la vez.</p></div><button className="button primary" onClick={() => { setSuccess(''); setEditor({ selected: null }) }}><Icon name="plus" />Crear usuario</button></div>
    <div className="stats-grid">
      {[['Total de usuarios', result?.stats.total, 'users', 'Todas las cuentas'], ['Clientes', result?.stats.clients, 'user', 'Nuestra comunidad'], ['Administradores', result?.stats.admins, 'shield', 'Equipo de gestión']].map(([label, value, icon, description]) => <div className="stat-card" key={label}><div><span>{label}</span><strong>{value ?? '—'}</strong><small>{description}</small></div><span className={'stat-icon ' + icon}><Icon name={icon} size={24} /></span></div>)}
    </div>
    <Notice type="success">{success}</Notice>
    <section className="panel users-panel" aria-label="Listado de usuarios">
      <div className="table-toolbar"><div><h2>Tu comunidad</h2><p>Consulta y administra las cuentas registradas.</p></div><span className="count-label">{result?.total ?? '—'} resultados</span></div>
      <form className="filters" onSubmit={event => { event.preventDefault(); setFilters(previous => ({ ...previous, search: search.trim(), page: 1 })) }}>
        <div className="search-input"><Icon name="search" /><input type="search" aria-label="Buscar usuarios por nombre o correo" placeholder="Buscar por nombre o correo…" value={search} maxLength={255} onChange={event => setSearch(event.target.value)} /></div>
        <select aria-label="Filtrar por rol" value={filters.role} onChange={event => setFilters(previous => ({ ...previous, role: event.target.value, page: 1 }))}><option value="">Todos los roles</option><option value="cliente">Clientes</option><option value="admin">Administradores</option></select>
        <button className="button secondary" type="submit">Buscar</button>
      </form>
      {error ? <div className="table-state"><Notice>{error}</Notice><button className="button secondary" onClick={() => setRevision(value => value + 1)}>Reintentar</button></div> : loading ? <Loading text="Cargando usuarios…" /> : result?.data.length ? <>
        <div className="table-scroll"><table><thead><tr><th>USUARIO</th><th>ROL</th><th>FECHA DE REGISTRO</th><th className="actions-heading">ACCIONES</th></tr></thead><tbody>{result.data.map(account => <tr key={account.id}><td><div className="table-user"><Avatar user={account} /><div><strong>{account.name}{account.id === user.id && <span className="you-label">Tú</span>}</strong><span>{account.email}</span></div></div></td><td><RoleBadge role={account.role} /></td><td className="date-cell">{new Date(account.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td><td><div className="row-actions"><button className="icon-button" aria-label={'Editar a ' + account.name} onClick={() => { setSuccess(''); setEditor({ selected: account }) }}><Icon name="edit" size={18} /></button><button className="icon-button danger" aria-label={'Eliminar a ' + account.name} title={account.id === user.id ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'} disabled={account.id === user.id} onClick={() => { setDeleting(account); setDeleteError('') }}><Icon name="trash" size={18} /></button></div></td></tr>)}</tbody></table></div>
        <div className="pagination"><span>Mostrando {result.from}–{result.to} de {result.total} usuarios</span><div><button className="button secondary small" disabled={filters.page <= 1} onClick={() => setFilters(previous => ({ ...previous, page: previous.page - 1 }))}>Anterior</button><span aria-live="polite">{result.current_page} / {result.last_page}</span><button className="button secondary small" disabled={filters.page >= result.last_page} onClick={() => setFilters(previous => ({ ...previous, page: previous.page + 1 }))}>Siguiente</button></div></div>
      </> : <div className="empty-state"><Icon name="users" size={38} /><h3>No encontramos usuarios</h3><p>Prueba con otro nombre, correo o filtro.</p><button className="button secondary" onClick={() => { setSearch(''); setFilters({ search: '', role: '', page: 1 }) }}>Limpiar filtros</button></div>}
    </section>
    <p className="permission-note"><Icon name="shield" size={16} /> Solo los administradores pueden acceder a este módulo.</p>
    {editor && <UserForm selected={editor.selected} onClose={() => setEditor(null)} onSaved={saved} />}
    {deleting && <Modal title="Eliminar usuario" busy={deleteBusy} onClose={() => setDeleting(null)}><div className="delete-symbol"><Icon name="trash" size={26} /></div><p>Vas a eliminar la cuenta de <strong>{deleting.name}</strong> ({deleting.email}). Esta acción no se puede deshacer.</p><Notice>{deleteError}</Notice><div className="dialog-actions"><button className="button secondary" disabled={deleteBusy} onClick={() => setDeleting(null)}>Cancelar</button><button className="button danger-solid" disabled={deleteBusy} onClick={removeUser}>{deleteBusy ? 'Eliminando…' : 'Eliminar cuenta'}</button></div></Modal>}
  </>
}
