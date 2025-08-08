import { BrowserRouter, Routes, Route } from "react-router-dom";
import ApplyForm from "./pages/form/ApplyForm";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Login from "./pages/admin/Login";
import ThanksPage from './pages/ThanksPages';
import { MantineProvider ,createTheme} from '@mantine/core';
import { useState } from "react";
import { Notifications } from '@mantine/notifications';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import ProtectedRoute from "./pages/routes/ProtectedRoute";

function App() {
  const [phone, setPhone] = useState('');


  const theme = createTheme({
    primaryColor: 'red',
    fontFamily: 'Inter, sans-serif',
    colors: {
      red: ['#fff1f1', '#ffe0e0', '#fabbbb', '#ff8a8a', '#ff5c5c', '#ff2d2d', '#ff0000', '#e60000', '#cc0000', '#b30000'],
    },
  });

  return (
    <MantineProvider theme={theme}>
  <Notifications position="bottom-left" />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ApplyForm value={phone} onChange={(e) => setPhone(e.target.value)}  />} />
        <Route
    path="/admin"
    element={
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    }/>
        <Route path="/login" element={<Login />} />
        <Route path="/thanks" element={<ThanksPage />} />
      </Routes>
    </BrowserRouter>
    </MantineProvider>
  );
}

export default App;