import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import App from '@/App';
import i18n from '@/locales';
import { createAppStore } from '@/store';

export async function renderApp() {
  const store = createAppStore();
  await i18n.changeLanguage('en-US');

  return {
    store,
    ...render(
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </Provider>,
    ),
  };
}
