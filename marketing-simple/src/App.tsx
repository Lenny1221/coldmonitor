import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Product from './pages/Product';
import Oplossingen from './pages/Oplossingen';
import Prijzen from './pages/Prijzen';
import Servicepartner from './pages/Servicepartner';
import Handleidingen from './pages/Handleidingen';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import AppPage from './pages/AppPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product" element={<Product />} />
        <Route path="/oplossingen" element={<Oplossingen />} />
        <Route path="/prijzen" element={<Prijzen />} />
        <Route path="/servicepartner" element={<Servicepartner />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/handleidingen" element={<Handleidingen />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
}
