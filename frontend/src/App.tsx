import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ChatPage } from './components/ChatPage'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { AppointmentsPage } from './components/dashboard/AppointmentsPage'
import { AppLayout } from './components/layout/AppLayout'
import './styles/app.css'
import './styles/chat.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/citas" element={<AppointmentsPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
