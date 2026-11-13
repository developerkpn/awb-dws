import { useEffect, useRef, useState } from 'react'
import { Button } from '@/ui/Button'
import { Camera } from '@/ui/icons'
import { Modal } from '@/ui/Modal'
import { cameraErrorMessage, toJpeg } from '@/utils/photo'
import type { CameraCaptureProps } from '@/types/registration'

// Browsers only open the camera on HTTPS or localhost.
const canOpenCamera = () => window.isSecureContext && !!navigator.mediaDevices?.getUserMedia

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [supported] = useState(canOpenCamera)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supported) return

    let stream: MediaStream | null = null
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: 'environment' },
        },
      })
      .then((media) => {
        if (cancelled) return media.getTracks().forEach((track) => track.stop())

        stream = media

        if (videoRef.current) videoRef.current.srcObject = media
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(cameraErrorMessage(err))
      })

    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [supported])

  const capture = () => {
    const video = videoRef.current

    if (!video?.videoWidth) return

    onCapture(toJpeg(video, video.videoWidth, video.videoHeight))
  }

  const message = supported
    ? error
    : 'The camera only opens when the console is served over HTTPS. Ask IT to open the console over HTTPS.'

  return (
    <Modal title="Driver photo" size="lg" onClose={onClose}>
      <div className="space-y-4">
        {message ? (
          <p role="alert" className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            {message}
          </p>
        ) : (
          <div className="relative aspect-video overflow-hidden rounded-xl bg-stone-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onPlaying={() => setReady(true)}
              className="size-full object-cover"
            />
            {!ready && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-stone-300">
                Opening the camera…
              </p>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {!message && (
            <Button type="button" disabled={!ready} onClick={capture}>
              <Camera className="size-4" />
              Capture
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
