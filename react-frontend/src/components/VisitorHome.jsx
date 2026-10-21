import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Icon } from './ui'
import ShowProducts from './ShowProducts'

export default function VisitorHome() {
  const { user } = useAuth()
  return <div className="visitor-page">
    <header className="public-header">
      <Link className="brand" to="/"><span className="brand-mark"><Icon name="star" /></span>anime<span className="brand-thin">store</span><span className="brand-dot">.</span></Link>
      <nav aria-label="Navegación principal">{user ? <Link className="button primary small" to={user.role === 'admin' ? '/admin/productos' : '/mi-cuenta'}>{user.role === 'admin' ? 'Administrar tienda' : 'Mi espacio'} <Icon name="arrow" /></Link> : <><Link className="text-link" to="/login">Iniciar sesión</Link><Link className="button primary small" to="/registro">Crear cuenta <Icon name="arrow" /></Link></>}</nav>
    </header>
    <main className="visitor-main">
      <div className="launch-label"><span /> FIGURAS Y COLECCIONABLES PARA FANS</div>
      <div className="visitor-hero">
        <div className="visitor-copy"><span className="eyebrow">BIENVENIDO A ANIME STORE</span><h1>Tu pasión merece<br />su propio <em>universo.</em></h1><p>Descubre figuras y productos de tus historias favoritas. Explora el catálogo; no necesitas una cuenta para verlo.</p>
          <div className="hero-actions"><a className="button primary" href="#productos">Explorar catálogo<Icon name="arrow" /></a>{user ? <Link className="text-link" to={user.role === 'admin' ? '/admin/productos' : '/mi-cuenta'}>{user.role === 'admin' ? 'Administrar productos' : 'Ir a mi cuenta'}</Link> : <Link className="text-link" to="/login">Iniciar sesión</Link>}</div>
          <div className="hero-note"><Icon name="shield" size={17} /><span>Productos visibles para toda la comunidad.</span></div>
        </div>
        <div className="coming-art" aria-label="Anime Store, figuras y coleccionables"><div className="art-grid" /><span className="art-top">ANIME STORE / VOL. 01</span><div className="orbit orbit-one" /><div className="orbit orbit-two" /><Icon name="star" size={150} /><div className="art-bottom"><span>NUEVAS HISTORIAS.<br />NUEVOS FAVORITOS.</span><strong>Explora el catálogo ↗</strong></div><span className="art-sticker">PARA<br />FANS.</span></div>
      </div>
      <ShowProducts />
      <section className="next-chapter"><div><span className="eyebrow">ÚNETE A LA COMUNIDAD</span><h2>Tu espacio también te espera.</h2></div><p>Crea una cuenta para mantener tus datos al día y formar parte de la comunidad de Anime Store.</p><Link className="coming-badge" to={user ? '/mi-cuenta' : '/registro'}><Icon name="user" /> {user ? 'Ir a mi perfil' : 'Crear una cuenta'}</Link></section>
    </main>
    <footer className="public-footer"><span>Anime Store © {new Date().getFullYear()}</span><span>Una comunidad. Infinitas historias.</span></footer>
  </div>
}
