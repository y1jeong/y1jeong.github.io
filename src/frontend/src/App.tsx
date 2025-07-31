import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { Design } from '@/pages/Design';
import { Gallery } from '@/pages/Gallery';
import { Profile } from '@/pages/Profile';
import { Settings } from '@/pages/Settings';
import { Features } from '@/pages/Features';
import { Pricing } from '@/pages/Pricing';
import { Templates } from '@/pages/Templates';
import { Contact } from '@/pages/Contact';
import { Help } from '@/pages/Help';
import { Docs } from '@/pages/Docs';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { Admin } from '@/pages/Admin';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="rhino-perforated-wall-theme">
        <AuthProvider>
          <Router>
            <Routes>
              {/* Auth routes - no layout */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              
              {/* Main app routes - with layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="design" element={<Design />} />
                <Route path="gallery" element={<Gallery />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="features" element={<Features />} />
                <Route path="pricing" element={<Pricing />} />
                <Route path="templates" element={<Templates />} />
                <Route path="contact" element={<Contact />} />
                <Route path="help" element={<Help />} />
                <Route path="docs" element={<Docs />} />
                <Route path="admin" element={<Admin />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;