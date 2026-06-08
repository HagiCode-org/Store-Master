import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import App from '@/App';
import i18n from '@/locales';
import { createAppStore } from '@/store';
import { loadProducts } from '@/store/slices/productManagementSlice';

export async function renderApp() {
  const store = createAppStore();
  await i18n.changeLanguage('en-US');

  const result = {
    store,
    ...render(
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </Provider>,
    ),
  };

  await store.dispatch(loadProducts());

  return result;
}
