import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { LoginPage, RegisterPage } from '../features/auth/pages/LoginPage'
import ForumsPage from '../features/forums/pages/ForumsPage'
import ThreadsPage from '../features/threads/pages/ThreadsPage'
import ThreadDetailPage from '../features/threads/pages/ThreadDetailPage'
import AdminPage from '../../src/features/auth/pages/AdminPage.tsx'
import HotTopicsPage from '../features/threads/pages/HotTopicsPage'
import SettingsPage from '../features/auth/pages/SettingsPage.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <ForumsPage /> },
      { path: 'channels/:channelId', element: <ThreadsPage /> },
      { path: 'channels/:channelId/topics/:topicId', element: <ThreadDetailPage /> },
      { path: 'saved', element: <div className="text-slate-400 text-center py-16">Temas guardados — próximamente</div> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'hot', element: <HotTopicsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])

export const AppRouter = () => <RouterProvider router={router} />

export default AppRouter
