import React from 'react';
import ReactDOM from 'react-dom/client';
import { MainPage } from '@/components/app/main-page';
import UploadPage from '@/app/upload/page';
import { Toaster } from '@/components/ui/toaster';
import './index.css';

const App = () => {
  const [path, setPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const onLocationChange = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  switch (path) {
    case '/':
      return <MainPage />;
    case '/upload':
      return <UploadPage />;
    default:
      return <MainPage />;
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);
