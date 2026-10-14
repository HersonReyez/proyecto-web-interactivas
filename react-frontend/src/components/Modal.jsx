import { useEffect, useRef } from 'react'
import { Icon } from './ui'

export default function Modal({ title, onClose, busy = false, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} className="app-dialog" aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <div className="dialog-heading"><h2 id="dialog-title">{title}</h2><button type="button" className="icon-button" aria-label="Cerrar diálogo" disabled={busy} onClick={onClose}><Icon name="close" /></button></div>
    {children}
  </dialog>
}
