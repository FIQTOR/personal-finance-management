import { Suspense } from 'react';
import { BrowserRouter as Router, useRoutes, useLocation } from 'react-router-dom';
import routes from '~react-pages';
import MainLayout from './layouts/MainLayout';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import AuthMiddleware from './components/AuthMiddleware';
import './App.css'
import LoadingPage from './components/LoadingPage';
import { NotificationContainer } from './components/Notification';
import PanelLayout from './layouts/PanelLayout';

function AppRoutes() {
  const element = useRoutes(routes);
  const location = useLocation();

  if (!element) return null;

  return (
    <AnimatePresence mode="wait">
      <div key={location.pathname} className="w-full">
        <PageTransition>
          {element}
        </PageTransition>
      </div>
    </AnimatePresence>
  );
}

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isPanel = location.pathname.startsWith('/panel');
  const Layout = isPanel ? PanelLayout : MainLayout;
  return (
    <Layout>
      {children}
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AuthMiddleware>
        <LayoutWrapper>
          <Suspense fallback={
            <LoadingPage />
          }>
            <AppRoutes />
          </Suspense>
        </LayoutWrapper>
      </AuthMiddleware>
      <NotificationContainer />
    </Router>
  );
}

export default App;