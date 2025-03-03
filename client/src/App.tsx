import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Box minH="100vh">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            {/* Add other protected routes here */}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Box>
    </AuthProvider>
  )
}

export default App
