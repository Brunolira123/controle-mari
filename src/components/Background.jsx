// src/components/Background.jsx
import './Background.css'

function Background() {
  return (
    <div className="background">
      <div 
        className="background-image"
        style={{
          backgroundImage: `url(/pwa-512x512.png)`
        }}
      />
      <div className="background-overlay" />
    </div>
  )
}

export default Background