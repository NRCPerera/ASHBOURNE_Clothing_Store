import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';

export default function MainLayout() {
  return (
    <>
      <Header />
      <main style={{ minHeight: 'calc(100vh - var(--header-height))' }}>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
