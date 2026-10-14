import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import { useForm } from '../lib/useForm'
import { Avatar, Field, Icon, Notice, RoleBadge } from './ui'

export default function Profile() {
  const { user, setUser } = useAuth()
  const form = useForm({ name: user.name, email: user.email, current_password: '', password: '', password_confirmation: '' })
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaved(false)
    await form.submit(async values => {
      const { data } = await api.put('/profile', values)
      setUser(data.user)
      form.setValues({ name: data.user.name, email: data.user.email, current_password: '', password: '', password_confirmation: '' })
      setSaved(true)
    })
  }

  return <>
    <div className="page-heading"><div><span className="eyebrow">TU CUENTA, A TU MANERA</span><h1>Mi perfil<span>.</span></h1><p>Un espacio para mantener tus datos al día.</p></div><span className="heading-icon"><Icon name="user" size={28} /></span></div>
    <div className="profile-grid">
      <aside className="panel profile-card"><Avatar user={user} large /><h2>{user.name}</h2><p className="profile-email">{user.email}</p><RoleBadge role={user.role} /><div className="member-since">MIEMBRO DESDE<strong>{new Date(user.created_at).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</strong></div><div className="profile-tip"><Icon name="shield" /><p>Tu contraseña actual es necesaria para cambiar tu correo o contraseña.</p></div></aside>
      <form className="panel profile-form" onSubmit={handleSubmit}>
        <Notice>{form.message}</Notice>
        <Notice type="success">{saved ? 'Tus cambios se guardaron correctamente.' : ''}</Notice>
        <fieldset disabled={form.busy}>
          <div className="section-heading"><span className="section-number">01</span><div><h2>Información personal</h2><p>Así te conocemos en la comunidad.</p></div></div>
          <Field label="Nombre completo" autoComplete="name" required maxLength={255} {...form.field('name')} />
          <Field label="Correo electrónico" type="email" autoComplete="email" required maxLength={255} {...form.field('email')} />
          <div className="section-heading divider"><span className="section-number">02</span><div><h2>Seguridad</h2><p>Deja la nueva contraseña vacía si deseas conservarla.</p></div></div>
          <Field label="Contraseña actual" type="password" autoComplete="current-password" maxLength={72} {...form.field('current_password')} />
          <div className="form-row"><Field label="Nueva contraseña" type="password" autoComplete="new-password" minLength={8} maxLength={72} hint="Entre 8 y 72 caracteres." {...form.field('password')} /><Field label="Confirmar nueva contraseña" type="password" autoComplete="new-password" minLength={8} maxLength={72} {...form.field('password_confirmation')} /></div>
          <div className="form-footer"><span>Los cambios se aplican a tu cuenta.</span><button type="submit" className="button primary">{form.busy ? 'Guardando…' : 'Guardar cambios'}<Icon name="check" /></button></div>
        </fieldset>
      </form>
    </div>
  </>
}
