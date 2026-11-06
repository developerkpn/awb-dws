import { useId, useState } from 'react'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import SettingsBrightnessOutlined from '@mui/icons-material/SettingsBrightnessOutlined'
import CheckOutlined from '@mui/icons-material/CheckOutlined'
import { useTheme, type ThemePreference } from '../providers/ThemeProvider'
import { IconButton } from '../atoms/Button'
import '../styles/forms.css'

const choices = [
  { value: 'light', label: 'Light mode', Icon: LightModeOutlined },
  { value: 'dark', label: 'Dark mode', Icon: DarkModeOutlined },
  { value: 'system', label: 'System theme', Icon: SettingsBrightnessOutlined },
] as const

export function ThemeControl() {
  const id = useId()
  const { preference, resolved, setPreference } = useTheme()
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const Icon =
    preference === 'system'
      ? SettingsBrightnessOutlined
      : resolved === 'dark'
        ? DarkModeOutlined
        : LightModeOutlined
  const choose = (value: ThemePreference) => {
    setPreference(value)
    document.getElementById(id)?.hidePopover()
  }

  return (
    <div className="ui-theme-control">
      <IconButton
        label="Change theme"
        popoverTarget={id}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          setPosition({
            left: Math.max(8, Math.min(rect.left, innerWidth - 200)),
            top: rect.bottom + 180 > innerHeight ? Math.max(8, rect.top - 180) : rect.bottom + 8,
          })
        }}
      >
        <Icon />
      </IconButton>
      <div
        id={id}
        popover="auto"
        className="ui-theme-menu"
        style={position}
        aria-label="Color theme"
      >
        <p>Appearance</p>
        {choices.map(({ value, label, Icon: OptionIcon }) => (
          <button
            type="button"
            key={value}
            aria-pressed={preference === value}
            onClick={() => choose(value)}
          >
            <OptionIcon />
            <span>{label}</span>
            {preference === value && <CheckOutlined />}
          </button>
        ))}
      </div>
    </div>
  )
}
