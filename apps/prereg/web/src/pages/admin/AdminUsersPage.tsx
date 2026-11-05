import { useState, useMemo, useEffect, type FormEvent } from 'react'
import {
  UserManagementView,
  type UserAccount,
  type UserFormData,
  type UserRole,
  type AccountType,
} from '../../components/admin/UserManagementView'

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    name: 'Bambang Admin HO',
    username: 'admin',
    email: 'admin@kpncorp.com',
    phone: '+62 811 1234 567',
    accountType: 'INTERNAL',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2026-11-01',
  },
  {
    id: 'usr-2',
    name: 'Siti Rahma',
    username: 'logistic.ho',
    email: 'siti.rahma@kpncorp.com',
    phone: '+62 812 2345 678',
    accountType: 'INTERNAL',
    role: 'LOGISTIC',
    isActive: true,
    createdAt: '2026-11-02',
  },
  {
    id: 'usr-3',
    name: 'PT Indofood Sukses Makmur',
    username: 'KUNNR-10042',
    email: 'dispatch@indofood.co.id',
    phone: '+62 21 522 8888',
    accountType: 'PARTNER',
    role: 'CUSTOMER',
    sapCode: 'KUNNR-10042',
    plant: 'Priscolin Karawang',
    isActive: true,
    createdAt: '2026-11-02',
  },
  {
    id: 'usr-4',
    name: 'CV Sawit Makmur Perkasa',
    username: 'LIFNR-20085',
    email: 'logistics@sawitmakmur.com',
    phone: '+62 813 9988 7766',
    accountType: 'PARTNER',
    role: 'VENDOR',
    sapCode: 'LIFNR-20085',
    plant: 'Dumai Plant',
    isActive: true,
    createdAt: '2026-11-03',
  },
  {
    id: 'usr-5',
    name: 'Agus Setiawan',
    username: 'krani.karawang',
    email: 'agus.setiawan@kpncorp.com',
    phone: '+62 856 1234 987',
    accountType: 'INTERNAL',
    role: 'KRANIWB',
    isActive: true,
    createdAt: '2026-11-03',
  },
  {
    id: 'usr-6',
    name: 'Dedi Manager Pabrik',
    username: 'mgr.dumai',
    email: 'dedi.kurniawan@kpncorp.com',
    accountType: 'INTERNAL',
    role: 'MANAGER',
    isActive: false,
    createdAt: '2026-11-03',
  },
]

const DEFAULT_FORM_DATA: UserFormData = {
  name: '',
  username: '',
  email: '',
  phone: '',
  accountType: 'PARTNER',
  role: 'CUSTOMER',
  sapCode: '',
  plant: 'Priscolin Karawang',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [plantFilter, setPlantFilter] = useState('ALL')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD')
  const [formData, setFormData] = useState<UserFormData>(DEFAULT_FORM_DATA)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | undefined>()

  // Auto-dismiss feedback alert after 5 seconds
  useEffect(() => {
    if (!feedbackMessage) return
    const timer = setTimeout(() => {
      setFeedbackMessage(undefined)
    }, 5000)
    return () => clearTimeout(timer)
  }, [feedbackMessage])

  // Filtered User List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search match
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.sapCode && u.sapCode.toLowerCase().includes(q))

      // Type match
      const matchesType = typeFilter === 'ALL' || u.accountType === typeFilter

      // Role match
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter

      // Plant match (filtering applies to partners with plant access)
      const matchesPlant =
        plantFilter === 'ALL' ||
        (u.accountType === 'PARTNER' && (u.plant === plantFilter || u.plant === 'All Plants'))

      return matchesSearch && matchesType && matchesRole && matchesPlant
    })
  }, [users, searchQuery, typeFilter, roleFilter, plantFilter])

  // Open Add Modal
  const handleOpenAddModal = () => {
    setModalMode('ADD')
    setFormData(DEFAULT_FORM_DATA)
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = (user: UserAccount) => {
    setModalMode('EDIT')
    setFormData({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      accountType: user.accountType,
      role: user.role,
      sapCode: user.sapCode || '',
      plant: user.accountType === 'PARTNER' ? (user.plant || 'All Plants') : '',
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleFormChange = (field: keyof UserFormData, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }))
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!formData.name.trim()) errs.name = 'Name or company name is required'
    if (!formData.username.trim()) {
      errs.username =
        formData.accountType === 'PARTNER'
          ? 'Username (SAP code) is required'
          : 'Username is required'
    }
    if (formData.accountType === 'PARTNER' && !formData.plant) {
      errs.plant = 'Plant access is required'
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Invalid email format'
    }

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Save (Create / Update)
  const handleSaveUser = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (modalMode === 'ADD') {
        const newUser: UserAccount = {
          id: `usr-${Date.now()}`,
          name: formData.name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone || undefined,
          accountType: formData.accountType,
          role: formData.role,
          sapCode: formData.accountType === 'PARTNER' ? (formData.username.trim() || formData.sapCode) : undefined,
          plant: formData.accountType === 'PARTNER' ? (formData.plant || 'All Plants') : undefined,
          isActive: true,
          createdAt: new Date().toISOString().slice(0, 10),
        }

        setUsers((prev) => [newUser, ...prev])
        setFeedbackMessage(
          `Account for ${newUser.name} created successfully! Generated password has been sent to ${newUser.email || 'registered contact'}.`
        )
      } else {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === formData.id
              ? {
                  ...u,
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone || undefined,
                  role: formData.role,
                  sapCode: u.accountType === 'PARTNER' ? (formData.username.trim() || formData.sapCode) : undefined,
                  plant: u.accountType === 'PARTNER' ? (formData.plant || 'All Plants') : undefined,
                }
              : u
          )
        )
        setFeedbackMessage(`Account for ${formData.name} updated successfully.`)
      }

      setIsModalOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle Active / Deactivate
  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updatedStatus = !u.isActive
          setFeedbackMessage(
            `Account for ${u.name} is now ${updatedStatus ? 'Activated' : 'Deactivated'}.`
          )
          return { ...u, isActive: updatedStatus }
        }
        return u
      })
    )
  }

  // Reset Password
  const handleResetPassword = (userId: string) => {
    const target = users.find((u) => u.id === userId)
    if (!target) return

    const confirmReset = window.confirm(
      `Are you sure you want to reset password for "${target.name}"?\n\nA new system-generated password will be immediately sent to ${target.email}.`
    )

    if (confirmReset) {
      setFeedbackMessage(
        `Password reset successful! A new random password has been dispatched to ${target.email}.`
      )
    }
  }

  return (
    <UserManagementView
      users={filteredUsers}
      searchQuery={searchQuery}
      typeFilter={typeFilter}
      roleFilter={roleFilter}
      plantFilter={plantFilter}
      onSearchChange={setSearchQuery}
      onTypeFilterChange={setTypeFilter}
      onRoleFilterChange={setRoleFilter}
      onPlantFilterChange={setPlantFilter}
      onOpenAddModal={handleOpenAddModal}
      onOpenEditModal={handleOpenEditModal}
      onToggleStatus={handleToggleStatus}
      onResetPassword={handleResetPassword}
      isModalOpen={isModalOpen}
      modalMode={modalMode}
      formData={formData}
      formErrors={formErrors}
      isSubmitting={isSubmitting}
      onFormChange={handleFormChange}
      onSaveUser={handleSaveUser}
      onCloseModal={() => setIsModalOpen(false)}
      feedbackMessage={feedbackMessage}
      onDismissFeedback={() => setFeedbackMessage(undefined)}
    />
  )
}
