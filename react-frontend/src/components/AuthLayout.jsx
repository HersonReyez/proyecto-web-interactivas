import { Link } from 'react-router-dom'
import { Icon } from './ui'

export default function AuthLayout({ children }) {
  return <div className="auth-page">
    <aside className="auth-story">
      <Link className="brand light" to="/"><span className="brand-mark"><Icon name="star" /></span>anime<span className="brand-thin">store</span><span className="brand-dot">.</span></Link>
      <div className="auth-story-content">
        <span className="eyebrow light">UN MISMO UNIVERSO. MUCHAS HISTORIAS.</span>
        <h1>Tu lado fan.<br /><em>Tu propio espacio.</em></h1>
        <p>Un lugar para quienes encuentran algo especial en cada historia.</p>
        <div className="member-card" aria-hidden="true"><div><span>ANIME STORE</span><span>MEMBER CLUB</span></div><Icon name="star" size={90} /><div><span>EL PRÓXIMO CAPÍTULO</span><span>ES TUYO ↗</span></div></div>
      </div>
      <p className="story-footer">Hecho para fans, como tú. <span>01 / COMUNIDAD</span></p>
    </aside>
    <main className="auth-content">
      <Link to="/" className="back-link">← Volver al inicio</Link>
      <div className="auth-form-container">{children}</div>
      <p className="quiet auth-bottom">Tu comunidad empieza con una cuenta.</p>
    </main>
  </div>
}
