import { useState, useEffect } from 'react'
import { Screen } from '@awb/ui'

type Partner = {
  id: number
  code: string
  name: string
  role: string
}

type PartnerAccount = {
  id: number
  name: string
  email: string
  phone: string
  role: string
  isActive: boolean
  partners: { code: string; name: string; role: string }[]
  createdAt: string
}

export function PartnerManagementPage() {
  const [role, setRole] = useState<'CUSTOMER' | 'VENDOR' | 'INTERCO'>('CUSTOMER')
  const [availablePartners, setAvailablePartners] = useState<Partner[]>([])
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [accounts, setAccounts] = useState<PartnerAccount[]>([])

  const loadPartners = async (selectedRole: string) => {
    try {
      const res = await fetch(`/api/partners?role=${selectedRole}&available=true`)
      const json = await res.json()
      if (json.success) {
        setAvailablePartners(json.data)
      }
    } catch {
      // In standalone web dev without backend running, fallback demo
      setAvailablePartners([
        { id: 1, code: selectedRole === 'CUSTOMER' ? 'KUNNR-1001' : selectedRole === 'VENDOR' ? 'LIFNR-2001' : 'INTR-3001', name: `Mitra Demo ${selectedRole}`, role: selectedRole },
        { id: 2, code: selectedRole === 'CUSTOMER' ? 'KUNNR-1002' : selectedRole === 'VENDOR' ? 'LIFNR-2002' : 'INTR-3002', name: `Mitra Sejahtera ${selectedRole}`, role: selectedRole },
      ])
    }
  }

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/partner-accounts', {
        headers: { 'x-user-role': 'ADMIN' },
      })
      const json = await res.json()
      if (json.success) {
        setAccounts(json.data)
      }
    } catch {
      // Standalone web demo fallback
    }
  }

  useEffect(() => {
    loadPartners(role)
    setSelectedCodes([])
  }, [role])

  useEffect(() => {
    loadAccounts()
  }, [])

  const handleToggleCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (selectedCodes.length === 0) {
      setMessage({ type: 'error', text: 'Pilih minimal satu kode SAP mitra.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/partner-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({
          role,
          sapCodes: selectedCodes,
          name,
          email,
          phone,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        const errorDetail = json.details ? Object.values(json.details).flat().join(', ') : json.error
        throw new Error(errorDetail || 'Gagal membuat akun')
      }

      setMessage({
        type: 'success',
        text: `Akun mitra ${name} (${email}) berhasil dibuat! Password acak telah dibuat dan dikirimkan ke email mitra.`,
      })
      setName('')
      setEmail('')
      setPhone('')
      setSelectedCodes([])
      loadPartners(role)
      loadAccounts()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (account: PartnerAccount) => {
    try {
      const res = await fetch(`/api/partner-accounts/${account.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({ isActive: !account.isActive }),
      })
      const json = await res.json()
      if (json.success) {
        loadAccounts()
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah status akun')
    }
  }

  const handleResetPassword = async (account: PartnerAccount) => {
    if (!confirm(`Reset password untuk ${account.name} (${account.email})? Password baru akan dikirimkan ke email.`)) {
      return
    }

    try {
      const res = await fetch(`/api/partner-accounts/${account.id}/reset-password`, {
        method: 'POST',
        headers: {
          'x-user-role': 'ADMIN',
        },
      })
      const json = await res.json()
      if (json.success) {
        alert(json.data.message || 'Password baru berhasil dikirimkan ke email!')
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal reset password')
    }
  }

  return (
    <Screen title="Pembuatan & Manajemen Akun Mitra (Admin)">
      <p style={{ color: '#555', marginBottom: 20 }}>
        Admin membuat akun mitra (Customer, Vendor, Interco). Password acak yang kuat dibuat otomatis dan dikirimkan langsung ke email mitra.
      </p>

      {message && (
        <div
          style={{
            padding: 12,
            marginBottom: 20,
            borderRadius: 6,
            backgroundColor: message.type === 'success' ? '#e6f4ea' : '#fce8e6',
            color: message.type === 'success' ? '#137333' : '#c5221f',
            border: `1px solid ${message.type === 'success' ? '#a8dab5' : '#f5c2c7'}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Form Pembuatan Akun */}
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 20 }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Buat Akun Mitra Baru</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>1. Pilih Peran Akun:</label>
              <div style={{ display: 'flex', gap: 16 }}>
                {(['CUSTOMER', 'VENDOR', 'INTERCO'] as const).map((r) => (
                  <label key={r} style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={() => setRole(r)}
                      style={{ marginRight: 6 }}
                    />
                    {r} {r === 'CUSTOMER' ? '(KUNNR)' : r === 'VENDOR' ? '(LIFNR)' : '(Kode Interco)'}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                2. Pilih Kode SAP Mitra (Bisa lebih dari 1):
              </label>
              <div
                style={{
                  maxHeight: 140,
                  overflowY: 'auto',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  padding: 8,
                  backgroundColor: '#fafafa',
                }}
              >
                {availablePartners.length === 0 ? (
                  <div style={{ color: '#888', fontStyle: 'italic', fontSize: 13 }}>
                    Tidak ada kode SAP {role} yang belum terpakai.
                  </div>
                ) : (
                  availablePartners.map((p) => (
                    <label key={p.code} style={{ display: 'block', marginBottom: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={selectedCodes.includes(p.code)}
                        onChange={() => handleToggleCode(p.code)}
                        style={{ marginRight: 8 }}
                      />
                      <strong>{p.code}</strong> — {p.name}
                    </label>
                  ))
                )}
              </div>
              <small style={{ color: '#666' }}>
                Terpilih: {selectedCodes.length > 0 ? selectedCodes.join(', ') : 'Belum ada'}
              </small>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>3. Nama PIC Mitra:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: PT Sumber Sawit / Budi Santoso"
                style={{ width: '100%', padding: '8px 10px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>4. Email (Untuk Login & Kirim Password):</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                style={{ width: '100%', padding: '8px 10px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>5. Nomor HP:</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08123456789"
                style={{ width: '100%', padding: '8px 10px', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#1a73e8',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: 4,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Membuat Akun & Mengirim Email...' : 'Buat Akun Mitra'}
            </button>
          </form>
        </div>

        {/* Tabel Daftar Akun Mitra */}
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>Daftar Akun Mitra</h2>
            <button type="button" onClick={loadAccounts} style={{ padding: '4px 8px', fontSize: 12 }}>
              Refresh
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f3f4', textAlign: 'left' }}>
                  <th style={{ padding: 8, borderBottom: '1px solid #ccc' }}>Nama / Email</th>
                  <th style={{ padding: 8, borderBottom: '1px solid #ccc' }}>Peran</th>
                  <th style={{ padding: 8, borderBottom: '1px solid #ccc' }}>Kode SAP</th>
                  <th style={{ padding: 8, borderBottom: '1px solid #ccc' }}>Status</th>
                  <th style={{ padding: 8, borderBottom: '1px solid #ccc' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#888' }}>
                      Belum ada akun mitra terdaftar.
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => (
                    <tr key={acc.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 8 }}>
                        <strong>{acc.name}</strong>
                        <div style={{ color: '#666', fontSize: 11 }}>{acc.email}</div>
                      </td>
                      <td style={{ padding: 8 }}>{acc.role}</td>
                      <td style={{ padding: 8 }}>
                        {acc.partners?.map((p) => p.code).join(', ') || '-'}
                      </td>
                      <td style={{ padding: 8 }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 11,
                            backgroundColor: acc.isActive ? '#e6f4ea' : '#fce8e6',
                            color: acc.isActive ? '#137333' : '#c5221f',
                          }}
                        >
                          {acc.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td style={{ padding: 8 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(acc)}
                            style={{ fontSize: 11, padding: '2px 6px' }}
                          >
                            {acc.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetPassword(acc)}
                            style={{ fontSize: 11, padding: '2px 6px' }}
                          >
                            Reset Pwd
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Screen>
  )
}

