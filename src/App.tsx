import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import DataImport from '@/pages/DataImport'
import Attribution from '@/pages/Attribution'
import Timeline from '@/pages/Timeline'
import Report from '@/pages/Report'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/import" replace />} />
          <Route path="/import" element={<DataImport />} />
          <Route path="/attribution" element={<Attribution />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/report" element={<Report />} />
        </Route>
      </Routes>
    </Router>
  )
}
