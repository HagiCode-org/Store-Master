import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import { Toaster } from '@/components/ui/sonner';
import i18n from '@/locales';
import { store, useAppDispatch } from '@/store';
import { appStarted } from '@/store/listeners';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Renderer root element #root is missing');
}

function AppBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(appStarted());
    document.getElementById('loading-container')?.remove();
  }, [dispatch]);

  return <App />;
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <>
          <AppBootstrap />
          <Toaster closeButton richColors />
        </>
      </I18nextProvider>
    </Provider>
  </React.StrictMode>
);
