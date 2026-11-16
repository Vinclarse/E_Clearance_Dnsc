import { BrowserRouter } from 'react-router-dom'
import AdminApp from './admin/App.jsx'
import './admin/index.css'

export default function AdminPortal() {
  return (
    <BrowserRouter basename="/admin">
      <AdminApp />
    </BrowserRouter>
  )
}
