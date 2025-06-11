import React from 'react'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, isAuthenticated }) => {
  // Check localStorage for auth token as fallback
  const hasToken = localStorage.getItem('adminToken') === 'authenticated'
  
  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/admin-login" replace />
  }
  
  return children
}

export default ProtectedRoute 