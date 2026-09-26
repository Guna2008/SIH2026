import { useState } from 'react'
import { LocateFixed } from 'lucide-react'
import Button from '../ui/Button'

export default function LocationPicker({ register, setValue, errors, latitudeName = 'latitude', longitudeName = 'longitude' }) {
  const [locationError, setLocationError] = useState('')
  const [locating, setLocating] = useState(false)

  const useCurrentLocation = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Location is not supported by this browser.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValue(latitudeName, Number(coords.latitude.toFixed(6)), { shouldValidate: true })
        setValue(longitudeName, Number(coords.longitude.toFixed(6)), { shouldValidate: true })
        setLocating(false)
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Allow location access and try again.'
          : 'Could not get your current location. Please try again.'
        setLocationError(message)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-end gap-2">
        <div className="grid sm:grid-cols-2 gap-4 flex-1">
          <InputLocation label="Latitude" error={errors?.[latitudeName]?.message} {...register(latitudeName)} />
          <InputLocation label="Longitude" error={errors?.[longitudeName]?.message} {...register(longitudeName)} />
        </div>
        <Button type="button" variant="secondary" onClick={useCurrentLocation} loading={locating}>
          <LocateFixed size={16} />
          Use current location
        </Button>
      </div>
      {locationError && <p className="text-xs text-clay-600">{locationError}</p>}

    </div>
  )
}

function InputLocation({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>
      <input
        type="number"
        step="any"
        className={`w-full rounded-sm border bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ${error ? 'border-clay-400' : 'border-line'}`}
        {...props}
      />
      {error && <span className="block text-xs text-clay-600 mt-1">{error}</span>}
    </label>
  )
}
