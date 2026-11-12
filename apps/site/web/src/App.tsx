import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import AuthLayout from '@/layout/AuthLayout'
import BaseLayout from '@/layout/BaseLayout'
import LoadingState from '@/components/LoadingState'

const Login = lazy(() => import('@/pages/auth/login'))
const ForgotPassword = lazy(() => import('@/pages/auth/forgotPassword'))
const ListRegistration = lazy(() => import('@/pages/registration/listRegistration'))
const AddRegistration = lazy(() => import('@/pages/registration/addRegistration'))
const OverviewMaster = lazy(() => import('@/pages/master/overviewMaster'))
const ListMaster = lazy(() => import('@/pages/master/listMaster'))
const Weighbridge = lazy(() => import('@/pages/weighbridge/listWeighbridge'))
const Tcs = lazy(() => import('@/pages/tcs/listTcs'))
const Dashboard = lazy(() => import('@/pages/dashboard'))
const Admin = lazy(() => import('@/pages/admin'))
const NotFound = lazy(() => import('@/pages/notFound'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          <Route element={<BaseLayout />}>
            <Route index element={<Navigate to="/registrations" replace />} />
            <Route path="/registrations" element={<ListRegistration />} />
            <Route path="/registrations/new" element={<AddRegistration />} />
            <Route path="/masters" element={<OverviewMaster />} />
            <Route path="/masters/:kind" element={<ListMaster />} />
            <Route path="/weighbridge" element={<Weighbridge />} />
            <Route path="/tcs" element={<Tcs />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
