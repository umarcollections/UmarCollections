import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import PublicRoute from './components/auth/PublicRoute.jsx';
import AdminRoute from './components/admin/AdminRoute.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import StoreLayout from './components/store/StoreLayout.jsx';
import FullPageLoader from './components/common/FullPageLoader.jsx';

// Each page is its own chunk, loaded when first visited. Storefront pages are
// also fetched in the background once the first page is up, so moving around
// the shop never waits on a download.
const storeLoaders = [];
const storePage = (load) => {
  storeLoaders.push(load);
  return lazy(load);
};

const HomePage = storePage(() => import('./pages/home/HomePage.jsx'));
const ShopPage = storePage(() => import('./pages/products/ShopPage.jsx'));
const ProductPage = storePage(() => import('./pages/products/ProductPage.jsx'));
const CollectionsPage = storePage(() => import('./pages/categories/CollectionsPage.jsx'));
const AboutPage = storePage(() => import('./pages/about/AboutPage.jsx'));
const CartPage = storePage(() => import('./pages/cart/CartPage.jsx'));
const CheckoutPage = storePage(() => import('./pages/cart/CheckoutPage.jsx'));
const OrderPage = storePage(() => import('./pages/orders/OrderPage.jsx'));
const AuthPage = storePage(() => import('./pages/auth/AuthPage.jsx'));
const AccountPage = storePage(() => import('./pages/account/AccountPage.jsx'));
const PrivacyPage = storePage(() => import('./pages/legal/PrivacyPage.jsx'));
const TermsPage = storePage(() => import('./pages/legal/TermsPage.jsx'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage.jsx'));
const AdminProductsPage = lazy(() => import('./pages/products/AdminProductsPage.jsx'));
const AdminProductNewPage = lazy(() => import('./pages/products/AdminProductNewPage.jsx'));
const AdminProductEditPage = lazy(() => import('./pages/products/AdminProductEditPage.jsx'));
const AdminCategoriesPage = lazy(() => import('./pages/categories/AdminCategoriesPage.jsx'));
const AdminOrdersPage = lazy(() => import('./pages/orders/AdminOrdersPage.jsx'));
const AdminOrderPage = lazy(() => import('./pages/orders/AdminOrderPage.jsx'));
const AdminCustomersPage = lazy(() => import('./pages/customers/AdminCustomersPage.jsx'));
const AdminCustomerPage = lazy(() => import('./pages/customers/AdminCustomerPage.jsx'));
const AdminDiscountsPage = lazy(() => import('./pages/discounts/AdminDiscountsPage.jsx'));
const AdminSettingsPage = lazy(() => import('./pages/settings/AdminSettingsPage.jsx'));

const usePrefetchStorePages = () => {
  useEffect(() => {
    // A failed download is not an error here: the page tries again when visited
    const prefetch = () => storeLoaders.forEach((load) => load().catch(() => {}));
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetch);
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(prefetch, 2000);
    return () => clearTimeout(id);
  }, []);
};

const App = () => {
  usePrefetchStorePages();

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        {/* Storefront: open to everyone */}
        <Route element={<StoreLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products/:slug" element={<ProductPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/:orderNumber" element={<OrderPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Log in and sign up: one sliding page, only for logged-out visitors */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
          </Route>

          {/* Customer account: signed-in customers only */}
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<AccountPage />} />
          </Route>
        </Route>

        {/* Store management: admins only, with their own sign-in page */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="orders/:id" element={<AdminOrderPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<AdminProductNewPage />} />
            <Route path="products/:id" element={<AdminProductEditPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="customers/:email" element={<AdminCustomerPage />} />
            <Route path="discounts" element={<AdminDiscountsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
