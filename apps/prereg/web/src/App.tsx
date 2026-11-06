import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router'
import { PERMISSION } from '@/constant/PERMISSION'
import AuthLayout from '@/layout/AuthLayout'
import BaseLayout from '@/layout/BaseLayout'
import RBACLayout from '@/layout/RBACLayout'
import LoadingState from '@/components/LoadingState'

const Login = lazy(() => import('@/pages/auth/login'))
const ForgotPassword = lazy(() => import('@/pages/auth/forgotPassword'))
const Dashboard = lazy(() => import('@/pages/dashboard'))
const ListUser = lazy(() => import('@/pages/user/listUser'))
const AddUser = lazy(() => import('@/pages/user/addUser'))
const EditUser = lazy(() => import('@/pages/user/editUser'))
const PermissionOfRole = lazy(() => import('@/pages/role/permissionOfRole'))
const ListRole = lazy(() => import('@/pages/role/listRole'))
const PreRegistration = lazy(() => import('@/pages/preRegistration/listPreRegistration'))
const SubmitRequest = lazy(() => import('@/pages/preRegistration/submitRequest'))
const EditRequest = lazy(() => import('@/pages/preRegistration/editRequest'))
const Approval = lazy(() => import('@/pages/approval/listApproval'))
const Forbidden = lazy(() => import('@/pages/forbidden'))
const NotFound = lazy(() => import('@/pages/notFound'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingState shell />}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          <Route element={<BaseLayout />}>
            <Route index element={<Dashboard />} />
            <Route element={<RBACLayout permission={PERMISSION.USER.READ} adminOnly />}>
              <Route path="/users" element={<ListUser />} />
            </Route>
            <Route element={<RBACLayout permission={PERMISSION.USER.CREATE} adminOnly />}>
              <Route path="/users/new" element={<AddUser />} />
            </Route>
            <Route element={<RBACLayout permission={PERMISSION.USER.UPDATE} adminOnly />}>
              <Route path="/users/:id/edit" element={<EditUser />} />
            </Route>
            <Route element={<RBACLayout permission={PERMISSION.ROLE.READ} adminOnly />}>
              <Route path="/roles" element={<ListRole />} />
              <Route path="/roles/permissions" element={<Navigate to="/roles" replace />} />
              <Route path="/roles/:id/permissions" element={<PermissionOfRole />} />
            </Route>
            <Route element={<RBACLayout permission={PERMISSION.PREREG.READ} />}>
              <Route path="/pre-registration" element={<PreRegistration />} />
            </Route>
            <Route element={<RBACLayout permission={PERMISSION.PREREG.CREATE} />}>
              <Route path="/pre-registration/new" element={<SubmitRequest />} />
            </Route>
            <Route element={<RBACLayout permission={PERMISSION.PREREG.UPDATE} />}>
              <Route path="/pre-registration/:id/edit" element={<EditRequest />} />
            </Route>
            <Route element={<RBACLayout permission={PERMISSION.PREREG.APPROVE} />}>
              <Route path="/approval" element={<Approval />} />
            </Route>
            <Route path="/forbidden" element={<Forbidden />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
