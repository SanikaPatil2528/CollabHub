import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* We will map our controller views right here as we build them */}
        <Route path="/" element={<div className="p-8 font-semibold">Workspace Application Core Active. Waiting for paths...</div>} />
        <Route path="*" element={<div className="p-8">404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}