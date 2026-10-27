import { useId, useState } from 'react'

export function Icon({ name, size = 20, ...props }) {
  const paths = {
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3a4 4 0 0 1 0 8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    user: 'M20 21v-2a7 7 0 0 0-14 0v2M17 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    store: 'M3 10v10h18V10M2 10l3-7h14l3 7M2 10h20M9 20v-6h6v6',
    box: 'm21 8-9-5-9 5m18 0-9 5m9-5v10l-9 5m0-10L3 8m9 5v10m-9-15v10l9 5',
    'shopping-cart': 'M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6m4 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2m8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
    shield: 'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4m-4 9 3 3 5-5',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    edit: 'm16 3 5 5-12 12H4v-5L16 3m-3 3 5 5',
    trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
    logout: 'M9 3H4v18h5m6-15 6 6-6 6m-6-6h12',
    close: 'm6 6 12 12M6 18 18 6',
    star: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7',
    check: 'm5 12 4 4L19 6',
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.star} /></svg>
}

export function Field({ label, error, hint, type = 'text', id: suppliedId, ...props }) {
  const generatedId = useId()
  const id = suppliedId || generatedId
  const [visible, setVisible] = useState(false)
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <div className="input-wrap">
      <input id={id} type={type === 'password' && visible ? 'text' : type} aria-invalid={Boolean(error)} aria-describedby={error || hint ? id + '-help' : undefined} {...props} />
      {type === 'password' && <button type="button" className="password-toggle" onClick={() => setVisible(!visible)} aria-label={(visible ? 'Ocultar ' : 'Mostrar ') + label.toLowerCase()} aria-pressed={visible}>{visible ? 'Ocultar' : 'Ver'}</button>}
    </div>
    {(error || hint) && <small id={id + '-help'} className={error ? 'field-error' : 'field-hint'}>{error || hint}</small>}
  </div>
}

export function Notice({ children, type = 'error' }) {
  if (!children) return null
  return <div className={'notice ' + type} role={type === 'error' ? 'alert' : 'status'}>{children}</div>
}

export function Loading({ text = 'Cargando…' }) {
  return <div className="loading" role="status"><span className="spinner" />{text}</div>
}

export function Avatar({ user, large = false }) {
  return <span className={'avatar ' + (large ? 'large ' : '') + (user.role === 'admin' ? 'admin' : '')} aria-hidden="true">{user.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</span>
}

export function RoleBadge({ role }) {
  return <span className={'role-badge ' + role}>{role === 'admin' ? 'Administrador' : 'Cliente'}</span>
}
