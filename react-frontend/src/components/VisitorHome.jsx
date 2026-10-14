import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Icon } from './ui'

export default function VisitorHome() {
  const { user } = useAuth()
  return <div className="visitor-page">
    <header className="public-header">
      <Link className="brand" to="/"><span className="brand-mark"><Icon name="star" /></span>anime<span className="brand-thin">store</span><span className="brand-dot">.</span></Link>
      <nav aria-label="Navegación principal">{user ? <Link className="button primary small" to={user.role === 'admin' ? '/admin/usuarios' : '/mi-cuenta'}>Mi espacio <Icon name="arrow" /></Link> : <><Link className="text-link" to="/login">Iniciar sesión</Link><Link className="button primary small" to="/registro">Crear cuenta <Icon name="arrow" /></Link></>}</nav>
    </header>
    <main className="visitor-main">
      <div className="launch-label"><span /> EL PRÓXIMO CAPÍTULO ESTÁ EN CAMINO</div>
      <div className="visitor-hero">
        <div className="visitor-copy"><span className="eyebrow">BIENVENIDO A ANIME STORE</span><h1>Tu pasión merece<br />su propio <em>universo.</em></h1><p>Estamos preparando una tienda para acercarte a las historias y personajes que más te gustan. Mientras tanto, tu lugar en la comunidad ya está listo.</p>
          <div className="hero-actions"><Link className="button primary" to={user ? '/mi-cuenta' : '/registro'}>{user ? 'Ir a mi cuenta' : 'Quiero ser parte'}<Icon name="arrow" /></Link>{!user && <Link className="text-link" to="/login">Ya tengo una cuenta</Link>}</div>
          <div className="hero-note"><Icon name="shield" size={17} /><span>Tu cuenta, tus datos, tu espacio.</span></div>
        </div>
        <div className="coming-art" aria-label="Catálogo de Anime Store próximamente"><div className="art-grid" /><span className="art-top">ANIME STORE / VOL. 01</span><div className="orbit orbit-one" /><div className="orbit orbit-two" /><Icon name="star" size={150} /><div className="art-bottom"><span>NUEVAS HISTORIAS.<br />NUEVOS FAVORITOS.</span><strong>Próximamente ↗</strong></div><span className="art-sticker">PARA<br />FANS.</span></div>
      </div>
      <section className="next-chapter"><div><span className="eyebrow">LO QUE VIENE</span><h2>La tienda está tomando forma.</h2></div><p>El catálogo, el carrito y los pedidos llegarán en una próxima etapa. Hoy puedes crear tu cuenta y gestionar tu perfil.</p><span className="coming-badge"><Icon name="store" /> Catálogo en preparación</span></section>
    </main>
    <footer className="public-footer"><span>Anime Store © {new Date().getFullYear()}</span><span>Una comunidad. Infinitas historias.</span></footer>
  </div>
}
