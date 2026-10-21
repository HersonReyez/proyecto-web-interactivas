import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useForm } from '../lib/useForm'
import AuthLayout from './AuthLayout'
import { Field, Icon, Notice } from './ui'

export default function Login() {
  const { authenticate } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const form = useForm({ email: '', password: '' })

  async function handleSubmit(event) {
    event.preventDefault()
    await form.submit(async values => {
      const user = await authenticate('/login', values)
      const destination = location.state?.from
      navigate(destination?.startsWith('/') && !destination.startsWith('//') && (user.role === 'admin' || !destination.startsWith('/admin')) ? destination : user.role === 'admin' ? '/admin/productos' : '/mi-cuenta', { replace: true })
    })
  }

  return <AuthLayout>
    <span className="eyebrow">BIENVENIDO DE VUELTA</span>
    <h2>Continúa tu historia.</h2>
    <p className="intro">Inicia sesión para entrar a tu espacio en Anime Store.</p>
    <form onSubmit={handleSubmit}>
      <Notice>{form.message}</Notice>
      <fieldset disabled={form.busy}>
        <Field label="Correo electrónico" type="email" autoComplete="username" required maxLength={255} placeholder="tu@correo.com" {...form.field('email')} />
        <Field label="Contraseña" type="password" autoComplete="current-password" required maxLength={72} placeholder="Tu contraseña" {...form.field('password')} />
        <button className="button primary full" type="submit">{form.busy ? 'Entrando…' : 'Iniciar sesión'}<Icon name="arrow" /></button>
      </fieldset>
    </form>
    <p className="auth-switch">¿Es tu primera visita? <Link to="/registro">Crea una cuenta</Link></p>
  </AuthLayout>
}
