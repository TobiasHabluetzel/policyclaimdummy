import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ClaimDetailPage } from './ClaimDetailPage'
import InboxPage from './InboxPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/claim/:shortCode" element={<ClaimDetailPage />} />
        <Route path="/:tab" element={<InboxPage />} />
        <Route path="/" element={<InboxPage />} />
        <Route path="*" element={<InboxPage />} />
      </Routes>
    </BrowserRouter>
  )
}
