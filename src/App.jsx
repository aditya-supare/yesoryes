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
  const [particles, setParticles] = useState([])
  const [trails, setTrails] = useState([])
  const noButtonRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastMoveTime = useRef(0)
  const trailIdCounter = useRef(0)
  const movesSinceLastTrail = useRef(0)
  const previousButtonPosition = useRef(null)
  const audioRef = useRef(null)

  // Generate floating heart particles
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      startBottom: Math.random() * -100,
      animationDuration: 15 + Math.random() * 10,
      animationDelay: Math.random() * 15,
      size: 20 + Math.random() * 20
    }))
    setParticles(newParticles)

    // Try to autoplay music
    const playAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(err => console.log('Autoplay prevented:', err))
      }
    }
    
    // Try immediately
    playAudio()
    
    // Also try on first user interaction
    const handleInteraction = () => {
      playAudio()
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
    
    document.addEventListener('click', handleInteraction)
    document.addEventListener('keydown', handleInteraction)
    
    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
  }, [])

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

      // Check for trail collection
      setTrails(prevTrails => 
        prevTrails.filter(trail => {
          const distance = Math.sqrt(
            Math.pow(e.clientX - trail.x, 2) + Math.pow(e.clientY - trail.y, 2)
          )
          // Collect trail if cursor is within 30px
          return distance > 30
        })
      )

      if (!noButtonRef.current || showMessage || isVulnerable) return

      const now = Date.now()
      // Ultra-fast response - 20ms for instant reaction
      if (now - lastMoveTime.current < 20) return
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

        // Massive detection radius of 400px - detects cursor from extremely far away
        if (distance < 400) {
          setChaseCount(prev => prev + 1)
          movesSinceLastTrail.current++

          // Add trail only occasionally (every 12-18 moves) at the OLD position
          const trailFrequency = 12 + Math.floor(Math.random() * 7)
          if (movesSinceLastTrail.current >= trailFrequency && previousButtonPosition.current) {
            const newTrail = {
              id: trailIdCounter.current++,
              x: previousButtonPosition.current.x,
              y: previousButtonPosition.current.y
            }
            setTrails(prev => [...prev, newTrail])
            movesSinceLastTrail.current = 0
          }

          // Store current position before moving
          previousButtonPosition.current = {
            x: buttonCenterX,
            y: buttonCenterY
          }

          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight

          // Calculate direction away from mouse
          const angle = Math.atan2(buttonCenterY - mouseY, buttonCenterX - mouseX)
          
          // Extremely large movement distance - 500-700px
          const moveDistance = 500 + Math.random() * 200
          
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
      {/* Background music */}
      <audio ref={audioRef} loop autoPlay>
        <source src="/audio/song.mp3" type="audio/mpeg" />
      </audio>

      {/* Pixelated heart particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="pixel-heart"
          style={{
            left: `${particle.left}%`,
            bottom: `${particle.startBottom}%`,
            animationDuration: `${particle.animationDuration}s`,
            animationDelay: `${particle.animationDelay}s`,
            width: `${particle.size}px`,
            height: `${particle.size}px`
          }}
        />
      ))}

      {/* Mwah trails */}
      {trails.map(trail => (
        <div
          key={trail.id}
          className="mwah-trail"
          style={{
            left: trail.x,
            top: trail.y
          }}
        >
          mwah
        </div>
      ))}

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
                <source src="/videos/USbread.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
