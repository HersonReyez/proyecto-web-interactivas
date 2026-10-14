import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useForm } from '../lib/useForm'
import AuthLayout from './AuthLayout'
import { Field, Icon, Notice } from './ui'

export default function Register() {
  const { authenticate } = useAuth()
  const navigate = useNavigate()
  const form = useForm({ name: '', email: '', password: '', password_confirmation: '' })

  async function handleSubmit(event) {
    event.preventDefault()
    await form.submit(async values => {
      await authenticate('/register', values)
      navigate('/mi-cuenta', { replace: true })
    })
  }

  return <AuthLayout>
    <span className="eyebrow">TU HISTORIA EMPIEZA AQUÍ</span>
    <h2>Hay un lugar para ti.</h2>
    <p className="intro">Crea tu cuenta y forma parte de Anime Store.</p>
    <form onSubmit={handleSubmit}>
      <Notice>{form.message}</Notice>
      <fieldset disabled={form.busy}>
        <Field label="Nombre completo" autoComplete="name" required maxLength={255} placeholder="¿Cómo te llamas?" {...form.field('name')} />
        <Field label="Correo electrónico" type="email" autoComplete="email" required maxLength={255} placeholder="tu@correo.com" {...form.field('email')} />
        <Field label="Contraseña" type="password" autoComplete="new-password" required minLength={8} maxLength={72} hint="Entre 8 y 72 caracteres." {...form.field('password')} />
        <Field label="Confirmar contraseña" type="password" autoComplete="new-password" required minLength={8} maxLength={72} {...form.field('password_confirmation')} />
        <button className="button primary full" type="submit">{form.busy ? 'Creando cuenta…' : 'Crear mi cuenta'}<Icon name="arrow" /></button>
      </fieldset>
    </form>
    <p className="auth-switch">¿Ya eres parte? <Link to="/login">Inicia sesión</Link></p>
  </AuthLayout>
}
