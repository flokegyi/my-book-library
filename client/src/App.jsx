import { createBrowserRouter, RouterProvider } from 'react-router'
import AppShell from './components/AppShell.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AccountPage from './pages/AccountPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ReaderPage from './pages/ReaderPage.jsx'
import TagsPage from './pages/TagsPage.jsx'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: 'books/:id/read',
        element: <ReaderPage />,
      },
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <LibraryPage />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'tags',
            element: <TagsPage />,
          },
          {
            path: 'account',
            element: <AccountPage />,
          },
          {
            path: '*',
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
