import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 })
  const [showMessage, setShowMessage] = useState(false)
  const [noButtonText, setNoButtonText] = useState('No')
  const [chaseCount, setChaseCount] = useState(0)
  const [isVulnerable, setIsVulnerable] = useState(false)
  const noButtonRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastMoveTime = useRef(0)

  const handleYesClick = () => {
    setShowMessage(true)
  }

  const handleNoClick = () => {
    setNoButtonText('Yes! Bleh no escape')
    setTimeout(() => {
      setShowMessage(true)
    }, 500)
  }

  useEffect(() => {
    // Check if button should become vulnerable after 3000 chases
    if (chaseCount >= 3000 && !isVulnerable) {
      setIsVulnerable(true)
      // Reset after 3 seconds if not clicked
      const timer = setTimeout(() => {
        setIsVulnerable(false)
        setChaseCount(0)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [chaseCount, isVulnerable])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!noButtonRef.current || showMessage || isVulnerable) return

      const now = Date.now()
      // Reduced throttle to 30ms for more responsive movement
      if (now - lastMoveTime.current < 30) return
      lastMoveTime.current = now

      // Cancel previous animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        if (!noButtonRef.current) return

        const buttonRect = noButtonRef.current.getBoundingClientRect()
        const buttonCenterX = buttonRect.left + buttonRect.width / 2
        const buttonCenterY = buttonRect.top + buttonRect.height / 2

        const mouseX = e.clientX
        const mouseY = e.clientY

        // Calculate distance between mouse and button center
        const distance = Math.sqrt(
          Math.pow(mouseX - buttonCenterX, 2) + Math.pow(mouseY - buttonCenterY, 2)
        )

        // Massive detection radius of 300px - detects cursor from far away
        if (distance < 300) {
          setChaseCount(prev => prev + 1)

          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight

          // Calculate direction away from mouse
          const angle = Math.atan2(buttonCenterY - mouseY, buttonCenterX - mouseX)
          
          // Much larger movement distance - 400-500px
          const moveDistance = 400 + Math.random() * 100
          
          let newX = noButtonPosition.x + Math.cos(angle) * moveDistance
          let newY = noButtonPosition.y + Math.sin(angle) * moveDistance

          // Conservative bounds to prevent scrollbars
          const maxX = (viewportWidth / 2) - 200
          const maxY = (viewportHeight / 2) - 200
          const minX = -(viewportWidth / 2) + 200
          const minY = -(viewportHeight / 2) + 200

          newX = Math.max(minX, Math.min(maxX, newX))
          newY = Math.max(minY, Math.min(maxY, newY))

          setNoButtonPosition({ x: newX, y: newY })
        }
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [noButtonPosition, showMessage, isVulnerable])

  return (
    <div className="App">
      <div className="container">
        {!showMessage ? (
          <>
            <h1 className="question">Would you like to continue?</h1>
            <p className="subtitle">Choose your preference</p>
            
            <div className="button-container">
              <button 
                className="btn yes-btn"
                onClick={handleYesClick}
              >
                Yes
              </button>
              
              <button 
                ref={noButtonRef}
                className="btn no-btn"
                onClick={handleNoClick}
                style={{
                  transform: `translate(${noButtonPosition.x}px, ${noButtonPosition.y}px)`
                }}
              >
                {noButtonText}
              </button>
            </div>
          </>
        ) : (
          <div className="message">
            <div className="success-icon">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="38" fill="none" stroke="#34c759" strokeWidth="4"/>
                <path d="M 25 40 L 35 50 L 55 30" fill="none" stroke="#34c759" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </div>
            <h2>Thank you</h2>
            <p>Your response has been recorded.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
