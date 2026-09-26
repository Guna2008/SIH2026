import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, RefreshCw, X, CheckCircle, Zap, AlertCircle, Scan } from 'lucide-react'
import Button from '../ui/Button'
import { inventoryService } from '../../services/inventoryService'

export default function CameraScanModal({ isOpen, onClose, onDetected }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  const [facingMode, setFacingMode] = useState('environment')
  const [scanning, setScanning] = useState(false)
  const [autoScan, setAutoScan] = useState(true)
  const [error, setError] = useState('')
  const [successInfo, setSuccessInfo] = useState(null)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  // Start Camera Stream
  const startCamera = useCallback(async (mode = facingMode) => {
    setError('')
    setSuccessInfo(null)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by your browser')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Check available camera devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((d) => d.kind === 'videoinput')
      setHasMultipleCameras(videoDevices.length > 1)
    } catch (err) {
      console.error('Camera stream error:', err)
      setError(err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : `Could not access camera: ${err.message}`)
    }
  }, [facingMode])

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode)
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [isOpen, startCamera, stopCamera, facingMode])

  // Switch between front/back camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextMode)
    startCamera(nextMode)
  }

  // Capture current video frame and process with OpenCV backend
  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || scanning || successInfo) return
    const video = videoRef.current
    if (video.videoWidth === 0 || video.videoHeight === 0) return

    setScanning(true)
    setError('')

    try {
      let canvas = canvasRef.current
      if (!canvas) {
        canvas = document.createElement('canvas')
        canvasRef.current = canvas
      }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9)
      })

      if (!blob) throw new Error('Failed to capture frame from camera')

      const formData = new FormData()
      formData.append('photo', blob, 'camera_capture.jpg')

      const result = await inventoryService.scanExpiry(formData)

      if (result?.date_str || result?.expiry_date) {
        const detectedDate = result.date_str || result.expiry_date.slice(0, 10)
        setSuccessInfo({
          date: detectedDate,
          confidence: result.confidence || 0.9,
          text: result.extracted_text,
          message: result.message,
        })

        // Auto-fill into parent form
        onDetected(detectedDate, result)

        // Give user 1.2s visual confirmation before closing modal
        setTimeout(() => {
          stopCamera()
          onClose()
        }, 1200)
      } else {
        if (!autoScan) {
          setError('No clear expiry date detected. Align the printed date inside the frame.')
        }
      }
    } catch (err) {
      if (!autoScan) {
        setError(err.message || 'Scanning failed')
      }
    } finally {
      setScanning(false)
    }
  }, [scanning, successInfo, autoScan, onDetected, onClose, stopCamera])

  // Auto-scan timer (captures every 1.8s)
  useEffect(() => {
    if (isOpen && autoScan && !successInfo) {
      intervalRef.current = setInterval(() => {
        captureAndScan()
      }, 1800)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isOpen, autoScan, successInfo, captureAndScan])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-paper-raised rounded-lg border border-line shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-white">
          <div className="flex items-center gap-2">
            <Camera className="text-brand-600" size={18} />
            <h3 className="font-semibold text-ink text-base">Live Camera Expiry Scanner</h3>
          </div>
          <button
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="p-1 rounded-sm text-ink-soft hover:text-ink hover:bg-paper-sunken transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera Viewfinder Viewport */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />

          {/* Viewfinder Target Frame HUD */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            <div className="relative w-64 h-32 border-2 border-dashed border-emerald-400/90 rounded-md bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

              {/* Laser Scan Animation */}
              {!successInfo && (
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-[0_0_8px_#34d399]" />
              )}

              {/* Status pill inside box */}
              {successInfo ? (
                <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-lg">
                  <CheckCircle size={15} /> {successInfo.date} (Detected!)
                </div>
              ) : scanning ? (
                <span className="text-[11px] font-medium bg-black/60 text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                  <RefreshCw size={12} className="animate-spin text-emerald-400" /> OpenCV processing…
                </span>
              ) : (
                <span className="text-[11px] font-medium text-emerald-200 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  Align Expiry Label Here
                </span>
              )}
            </div>

            <p className="text-xs text-white/80 mt-3 font-medium drop-shadow text-center">
              EXP 28/11/2026 · BEST BEFORE · USE BY
            </p>
          </div>

          {/* Flash / Error Banner */}
          {error && (
            <div className="absolute bottom-3 inset-x-4 p-2.5 bg-red-600/90 text-white text-xs rounded shadow flex items-center gap-2 backdrop-blur-sm">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Controls Toolbar */}
        <div className="p-4 bg-white space-y-3">
          {successInfo ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-900 text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm flex items-center gap-1">
                  <CheckCircle size={16} className="text-emerald-600" /> Auto-filled: {successInfo.date}
                </p>
                <p className="text-emerald-700 mt-0.5">Confidence: {Math.round(successInfo.confidence * 100)}%</p>
              </div>
              <span className="text-emerald-600 text-xs font-medium">Closing…</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={autoScan ? 'primary' : 'secondary'}
                  onClick={() => setAutoScan((v) => !v)}
                  className="text-xs"
                >
                  <Zap size={14} className={autoScan ? 'text-amber-300' : ''} />
                  Auto-Scan {autoScan ? 'ON' : 'OFF'}
                </Button>

                {hasMultipleCameras && (
                  <Button size="sm" variant="secondary" onClick={toggleFacingMode} title="Flip Camera">
                    <RefreshCw size={14} /> Flip
                  </Button>
                )}
              </div>

              <Button
                variant="primary"
                loading={scanning}
                onClick={captureAndScan}
                className="gap-1.5"
              >
                <Scan size={16} /> Snap & Auto-Fill
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
