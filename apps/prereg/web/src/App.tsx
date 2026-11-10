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
const ListDriverRequest = lazy(() => import('@/pages/driverRequest/listDriverRequest'))
const SubmitDriverRequest = lazy(() => import('@/pages/driverRequest/submitDriverRequest'))
const EditDriverRequest = lazy(() => import('@/pages/driverRequest/editDriverRequest'))
const JulList = lazy(() => import('@/pages/jul/listJul'))
const JulForm = lazy(() => import('@/pages/jul/editJul'))
const JulDetail = lazy(() => import('@/pages/jul/viewJul'))
const BelList = lazy(() => import('@/pages/bel/listBel'))
const SapMaster = lazy(() => import('@/pages/sapMaster'))
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
            <Route element={<RBACLayout adminOnly />}>
              <Route path="/sap-master" element={<SapMaster />} />
            </Route>
            <Route element={<RBACLayout permission={PERMISSION.PREREG.READ} />}>
              <Route path="/driver-requests" element={<ListDriverRequest />} />
              <Route
                path="/pre-registration"
                element={<Navigate to="/driver-requests" replace />}
              />
            </Route>
            <Route
              element={
                <RBACLayout
                  permission={PERMISSION.PREREG.READ}
                  disallowedRoles={['VENDOR']}
                />
              }
            >
              <Route path="/jul" element={<JulList />} />
              <Route path="/jul/:id" element={<JulDetail />} />
            </Route>
            <Route
              element={
                <RBACLayout
                  permission={PERMISSION.PREREG.READ}
                  disallowedRoles={['CUSTOMER']}
                />
              }
            >
              <Route path="/bel" element={<BelList />} />
              <Route path="/bel/:id" element={<BelList />} />
            </Route>
            <Route element={<RBACLayout permission={PERMISSION.PREREG.CREATE} />}>
              <Route path="/driver-requests/new" element={<SubmitDriverRequest />} />
              <Route
                path="/pre-registration/new"
                element={<Navigate to="/driver-requests/new" replace />}
              />
            </Route>
            <Route
              element={
                <RBACLayout
                  permission={PERMISSION.PREREG.CREATE}
                  disallowedRoles={['VENDOR']}
                />
              }
            >
              <Route path="/jul/new" element={<JulForm />} />
            </Route>
            <Route
              element={
                <RBACLayout
                  permission={PERMISSION.PREREG.CREATE}
                  disallowedRoles={['CUSTOMER']}
                />
              }
            >
              <Route path="/bel/new" element={<BelList />} />
            </Route>
            <Route element={<RBACLayout permission={PERMISSION.PREREG.UPDATE} />}>
              <Route path="/driver-requests/:id/edit" element={<EditDriverRequest />} />
            </Route>
            <Route
              element={
                <RBACLayout
                  permission={PERMISSION.PREREG.UPDATE}
                  disallowedRoles={['VENDOR']}
                />
              }
            >
              <Route path="/jul/:id/edit" element={<JulForm />} />
            </Route>
            <Route
              element={
                <RBACLayout
                  permission={PERMISSION.PREREG.UPDATE}
                  disallowedRoles={['CUSTOMER']}
                />
              }
            >
              <Route path="/bel/:id/edit" element={<BelList />} />
            </Route>
            <Route element={<RBACLayout permission={PERMISSION.PREREG.APPROVE} />}>
              <Route
                path="/driver-requests/review"
                element={<Navigate to="/driver-requests" replace />}
              />
              <Route path="/approval" element={<Navigate to="/driver-requests/review" replace />} />
            </Route>
            <Route
              element={
                <RBACLayout
                  permission={PERMISSION.PREREG.APPROVE}
                  disallowedRoles={['VENDOR']}
                />
              }
            >
              <Route path="/jul/review" element={<JulList review />} />
            </Route>
            <Route
              element={
                <RBACLayout
                  permission={PERMISSION.PREREG.APPROVE}
                  disallowedRoles={['CUSTOMER']}
                />
              }
            >
              <Route path="/bel/review" element={<BelList review />} />
            </Route>
            <Route path="/forbidden" element={<Forbidden />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
