import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { themeStorageKey } from '@/store/slices/themeSlice';
import { renderApp } from './test/renderApp';

describe('Store Master app shell', () => {
  beforeEach(() => {
    window.localStorage.removeItem(themeStorageKey);
  });

  it('defaults to Products and keeps the selected product context when opening Product Data', async () => {
    await renderApp();

    expect(screen.getByText('Product registry')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Patch Harbor'));
    fireEvent.click(screen.getByRole('button', { name: 'Product Data' }));

    expect(screen.getByText('MS Store data maintenance')).toBeInTheDocument();
    expect(screen.getAllByText('Patch Harbor').length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(window.storeMaster.readMsStoreData).toHaveBeenCalledWith('prd-22222222-2222-4222-8222-222222222222');
    });
  });

  it('preserves the active section when the sidebar collapses', async () => {
    await renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Product Data' }));
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
    expect(screen.getByText('MS Store data maintenance')).toBeInTheDocument();
  });

  it('shows vertical settings tabs and persists theme changes locally', async () => {
    await renderApp();

    expect(document.documentElement.dataset.theme).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.getByRole('tab', { name: 'Appearance' })).toHaveAttribute('data-state', 'active');

    fireEvent.click(screen.getByRole('tab', { name: 'Workspace' }));
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Workspace' })).toHaveAttribute('data-state', 'active');
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Appearance' }));
    fireEvent.click(screen.getByRole('radio', { name: /Light/i }));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light');
      expect(window.localStorage.getItem(themeStorageKey)).toBe('light');
    });
  });

  it('reloads product-scoped data when switching products inside Product Data', async () => {
    await renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Product Data' }));
    fireEvent.click(screen.getByRole('button', { name: 'Signal Desk' }));
    fireEvent.click(screen.getByRole('button', { name: /Patch Harbor/ }));

    await waitFor(() => {
      expect(window.storeMaster.readMsStoreData).toHaveBeenLastCalledWith('prd-22222222-2222-4222-8222-222222222222');
    });

    expect(screen.getAllByText('Patch Harbor').length).toBeGreaterThan(0);
  });

  it('validates and persists MS Store records', async () => {
    await renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Product Data' }));
    await waitFor(() => {
      expect(screen.queryByText('Loading MS Store data...')).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save record' }));

    expect(screen.getByText('Locale is required.')).toBeInTheDocument();
    expect(screen.getByText('Market is required.')).toBeInTheDocument();
    expect(screen.getByText('Store ID is required.')).toBeInTheDocument();
    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Short description is required.')).toBeInTheDocument();
    expect(screen.getByText('Description is required.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Locale'), { target: { value: 'en-US' } });
    fireEvent.change(screen.getByLabelText('Market'), { target: { value: 'US' } });
    fireEvent.change(screen.getByLabelText('Store ID'), { target: { value: '9NTEST123' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Signal Desk Deluxe' } });
    fireEvent.change(screen.getByLabelText('Short description'), { target: { value: 'Localized Store summary.' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Desktop release workspace for operators.' } });
    fireEvent.change(screen.getByLabelText('Keywords'), { target: { value: 'desktop, release' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save record' }));

    await waitFor(() => {
      expect(window.storeMaster.writeMsStoreData).toHaveBeenCalled();
    });

    expect(screen.getByText('Signal Desk Deluxe')).toBeInTheDocument();
    expect(window.storeMaster.writeMsStoreData).toHaveBeenLastCalledWith(
      'prd-11111111-1111-4111-8111-111111111111',
      expect.objectContaining({
        productStorageId: 'prd-11111111-1111-4111-8111-111111111111',
        entries: [expect.objectContaining({
          locale: 'en-US',
          market: 'US',
          storeId: '9NTEST123',
          title: 'Signal Desk Deluxe',
          shortDescription: 'Localized Store summary.',
        })],
      }),
    );
  });

  it('keeps the current dataset when an import is rejected', async () => {
    const importMock = vi.mocked(window.storeMaster.importMsStoreData);

    await renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Product Data' }));
    await waitFor(() => {
      expect(screen.queryByText('Loading MS Store data...')).not.toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText('Locale'), { target: { value: 'en-US' } });
    fireEvent.change(screen.getByLabelText('Market'), { target: { value: 'US' } });
    fireEvent.change(screen.getByLabelText('Store ID'), { target: { value: '9NKEEP123' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Keep Me' } });
    fireEvent.change(screen.getByLabelText('Short description'), { target: { value: 'Existing summary should remain.' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Existing record should remain.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save record' }));

    await waitFor(() => {
      expect(window.storeMaster.writeMsStoreData).toHaveBeenCalledTimes(1);
    });

    importMock.mockResolvedValueOnce({
      success: false,
      filePath: '/tmp/bad-import.json',
      errors: [{ field: 'title', index: 0, messageKey: 'validation.msStore.titleRequired' }],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => {
      expect(screen.getByText('Import was rejected. Existing data was not changed.')).toBeInTheDocument();
    });

    expect(screen.getByText('Keep Me')).toBeInTheDocument();
    expect(window.storeMaster.writeMsStoreData).toHaveBeenCalledTimes(1);
  });
});
