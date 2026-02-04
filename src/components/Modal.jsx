// src/components/Modal.jsx
import './Modal.css'

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button 
            onClick={onClose} 
            className="modal-close-button"
          >
            ✕
          </button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal