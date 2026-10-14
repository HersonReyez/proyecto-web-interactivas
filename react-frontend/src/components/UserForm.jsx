import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import { useForm } from '../lib/useForm'
import Modal from './Modal'
import { Field, Notice } from './ui'

export default function UserForm({ selected, onClose, onSaved }) {
  const { user, setUser } = useAuth()
  const editing = Boolean(selected)
  const isSelf = selected?.id === user.id
  const form = useForm({ name: selected?.name || '', email: selected?.email || '', role: selected?.role || 'cliente', password: '', password_confirmation: '' })

  async function handleSubmit(event) {
    event.preventDefault()
    await form.submit(async values => {
      const { data } = editing ? await api.put('/users/' + selected.id, values) : await api.post('/users', values)
      if (isSelf) setUser(data.user)
      onSaved(data.message)
    })
  }

  return <Modal title={editing ? 'Editar usuario' : 'Crear usuario'} onClose={onClose} busy={form.busy}>
    <p className="dialog-description">{editing ? 'Actualiza los datos y permisos de esta cuenta.' : 'Agrega un nuevo miembro a la comunidad.'}</p>
    <form onSubmit={handleSubmit}>
      <Notice>{form.message}</Notice>
      <fieldset disabled={form.busy}>
        <Field label="Nombre completo" required maxLength={255} autoComplete="off" {...form.field('name')} />
        <Field label="Correo electrónico" type="email" required maxLength={255} autoComplete="off" {...form.field('email')} />
        <div className="field"><label htmlFor="user-role">Rol</label><select id="user-role" name="role" value={form.values.role} onChange={form.field('role').onChange} disabled={isSelf} aria-invalid={Boolean(form.errors.role)} aria-describedby="role-help"><option value="cliente">Cliente</option><option value="admin">Administrador</option></select><small id="role-help" className={form.errors.role ? 'field-error' : 'field-hint'}>{form.errors.role?.[0] || (isSelf ? 'Tu propio rol no se puede modificar.' : 'Los administradores pueden gestionar todas las cuentas.')}</small></div>
        <Field label={editing ? 'Nueva contraseña' : 'Contraseña'} type="password" autoComplete="new-password" required={!editing} minLength={8} maxLength={72} hint={editing ? 'Déjala vacía para mantener la actual.' : 'Entre 8 y 72 caracteres.'} {...form.field('password')} />
        <Field label="Confirmar contraseña" type="password" autoComplete="new-password" required={!editing || Boolean(form.values.password)} minLength={8} maxLength={72} {...form.field('password_confirmation')} />
        <div className="dialog-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button primary">{form.busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear usuario'}</button></div>
      </fieldset>
    </form>
  </Modal>
}
