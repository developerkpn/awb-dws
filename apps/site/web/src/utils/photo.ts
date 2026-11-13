const MAX_SIDE = 960

/** Scales the frame to at most 960 px on its longest side and encodes it as JPEG. */
export function toJpeg(source: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
  const canvas = document.createElement('canvas')

  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL('image/jpeg', 0.82)
}

export function cameraErrorMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : ''

  if (name === 'NotAllowedError')
    return 'Camera access is blocked. Allow the camera for this site in the browser and try again.'

  if (name === 'NotFoundError' || name === 'OverconstrainedError')
    return 'No camera was found. Connect a camera to this computer and try again.'

  if (name === 'NotReadableError')
    return 'The camera is in use by another app. Close that app and try again.'

  return 'The camera could not be opened. Check the camera and try again.'
}
