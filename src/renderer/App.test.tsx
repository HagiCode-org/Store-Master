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

    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Short description is required.')).toBeInTheDocument();
    expect(screen.getByText('Description is required.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Locale'), { target: { value: 'en-US' } });
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
        version: 3,
        entries: [expect.objectContaining({
          locale: 'en-US',
          fieldValues: expect.objectContaining({
            '4': 'Signal Desk Deluxe',
            '8': 'Localized Store summary.',
            '2': 'Desktop release workspace for operators.',
          }),
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
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Keep Me' } });
    fireEvent.change(screen.getByLabelText('Short description'), { target: { value: 'Existing summary should remain.' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Existing record should remain.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save record' }));

    await waitFor(() => {
      expect(window.storeMaster.writeMsStoreData).toHaveBeenCalledTimes(1);
    });

    importMock.mockResolvedValueOnce({
      success: false,
      filePath: '/tmp/bad-import.csv',
      errors: [{ field: 'fieldValues', index: 0, messageKey: 'validation.msStore.titleRequired' }],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Import CSV' }));

    await waitFor(() => {
      expect(screen.getByText('CSV import was rejected. Existing data was not changed.')).toBeInTheDocument();
    });

    expect(screen.getByText('Keep Me')).toBeInTheDocument();
    expect(window.storeMaster.writeMsStoreData).toHaveBeenCalledTimes(1);
  });

  it('saves a new locale record when existing locale rows are already loaded', async () => {
    vi.mocked(window.storeMaster.readMsStoreData).mockResolvedValueOnce({
      productStorageId: 'prd-11111111-1111-4111-8111-111111111111',
      version: 3,
      entries: [
        {
          id: 'ms-existing',
          productStorageId: 'prd-11111111-1111-4111-8111-111111111111',
          locale: 'en-US',
          keywords: ['desk'],
          fieldValues: {
            '4': 'Existing Title',
            '8': 'Existing summary',
            '2': 'Existing description',
          },
          createdAt: '2026-06-08 10:00',
          updatedAt: '2026-06-08 10:00',
        },
      ],
    });

    await renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Languages' }));
    await waitFor(() => {
      expect(screen.getByText('Language management')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add language' }));
    await waitFor(() => {
      expect(screen.getByText('MS Store data maintenance')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText('Locale'), { target: { value: 'ja-JP' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Japan Title' } });
    fireEvent.change(screen.getByLabelText('Short description'), { target: { value: 'Japan summary.' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Japan description.' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save record' }));

    await waitFor(() => {
      expect(window.storeMaster.writeMsStoreData).toHaveBeenCalled();
    });

    expect(screen.queryByText('Locale is required.')).not.toBeInTheDocument();
    expect(screen.queryByText('Title is required.')).not.toBeInTheDocument();
    expect(screen.queryByText('Short description is required.')).not.toBeInTheDocument();
    expect(screen.queryByText('Description is required.')).not.toBeInTheDocument();
  });

  it('deletes a locale record from the Languages page', async () => {
    vi.mocked(window.storeMaster.readMsStoreData).mockResolvedValueOnce({
      productStorageId: 'prd-11111111-1111-4111-8111-111111111111',
      version: 3,
      entries: [
        {
          id: 'ms-existing',
          productStorageId: 'prd-11111111-1111-4111-8111-111111111111',
          locale: 'en-US',
          keywords: ['desk'],
          fieldValues: {
            '4': 'Existing Title',
            '8': 'Existing summary',
            '2': 'Existing description',
          },
          createdAt: '2026-06-08 10:00',
          updatedAt: '2026-06-08 10:00',
        },
        {
          id: 'ms-zh',
          productStorageId: 'prd-11111111-1111-4111-8111-111111111111',
          locale: 'zh-CN',
          keywords: ['桌面'],
          fieldValues: {
            '4': '现有标题',
            '8': '现有摘要',
            '2': '现有描述',
          },
          createdAt: '2026-06-08 10:05',
          updatedAt: '2026-06-08 10:05',
        },
      ],
    });

    await renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Languages' }));
    await waitFor(() => {
      expect(screen.getByText('Language management')).toBeInTheDocument();
      expect(screen.getByText('English (United States)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);

    await waitFor(() => {
      expect(window.storeMaster.writeMsStoreData).toHaveBeenCalledWith(
        'prd-11111111-1111-4111-8111-111111111111',
        expect.objectContaining({
          entries: [
            expect.objectContaining({
              locale: 'en-US',
            }),
          ],
        }),
      );
    });
  });
});
