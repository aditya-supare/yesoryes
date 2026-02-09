import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 })
  const [showMessage, setShowMessage] = useState(false)
  const [noButtonText, setNoButtonText] = useState('No')
  const [chaseCount, setChaseCount] = useState(0)
  const [isVulnerable, setIsVulnerable] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [isClicking, setIsClicking] = useState(false)
  const noButtonRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastMoveTime = useRef(0)

  const handleYesClick = () => {
    setShowMessage(true)
  }

  const handleNoClick = () => {
    setNoButtonText('Yes! Bleh no escape!! ;3')
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
      setCursorPosition({ x: e.clientX, y: e.clientY })

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

          // Get button dimensions for proper bounds calculation
          const buttonWidth = buttonRect.width
          const buttonHeight = buttonRect.height
          
          // Calculate the original button center position
          const containerRect = noButtonRef.current.parentElement.getBoundingClientRect()
          const originalCenterX = containerRect.left + containerRect.width / 2
          const originalCenterY = containerRect.top + containerRect.height / 2

          // Calculate max translation to keep button fully visible
          // Use more conservative padding to ensure button stays well within viewport
          const padding = 50
          const maxX = (viewportWidth / 2) - (buttonWidth / 2) - padding - (originalCenterX - viewportWidth / 2)
          const minX = -(originalCenterX - padding - buttonWidth / 2)
          const maxY = (viewportHeight / 2) - (buttonHeight / 2) - padding - (originalCenterY - viewportHeight / 2)
          const minY = -(originalCenterY - padding - buttonHeight / 2)

          newX = Math.max(minX, Math.min(maxX, newX))
          newY = Math.max(minY, Math.min(maxY, newY))

          setNoButtonPosition({ x: newX, y: newY })
        }
      })
    }

    const handleMouseDown = () => {
      setIsClicking(true)
    }

    const handleMouseUp = () => {
      setIsClicking(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [noButtonPosition, showMessage, isVulnerable])

  return (
    <div className={`App ${showMessage ? 'sage-green' : ''}`}>
      <div 
        className={`cursor-heart ${isClicking ? 'clicking' : ''}`}
        style={{
          left: cursorPosition.x,
          top: cursorPosition.y
        }}
      ></div>

      <div className="container">
        {!showMessage ? (
          <>
            <div className="video-container">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="header-video"
              >
                <source src="/videos/1GRASSDOGS.mp4" type="video/mp4" />
              </video>
            </div>
            
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
            <div className="video-container afteryes-video">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="header-video"
              >
                <source src="/videos/afteryes.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
