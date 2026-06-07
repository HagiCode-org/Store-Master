import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { themeStorageKey } from '@/store/slices/themeSlice';
import { renderApp } from './test/renderApp';

describe('Store Master app shell', () => {
  beforeEach(() => {
    window.localStorage.removeItem(themeStorageKey);
  });

  it('defaults to Products and keeps the selected product context when opening Product Profile', async () => {
    await renderApp();

    expect(screen.getByText('Product registry')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Patch Harbor'));
    fireEvent.click(screen.getByRole('button', { name: 'Product Profile' }));

    expect(screen.getByText('This area is reserved for future product profile content.')).toBeInTheDocument();
    expect(screen.getAllByText('Patch Harbor').length).toBeGreaterThan(0);
  });

  it('preserves the active section when the sidebar collapses', async () => {
    await renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Product Profile' }));
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
    expect(screen.getByText('This area is reserved for future product profile content.')).toBeInTheDocument();
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

  it('blocks invalid product saves and surfaces required field errors', async () => {
    await renderApp();

    fireEvent.click(screen.getAllByRole('button', { name: 'Add product' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Save product' }));

    expect(screen.getByText('Product name is required.')).toBeInTheDocument();
    expect(screen.getByText('Product folder name is required.')).toBeInTheDocument();
    expect(screen.getByText('Select at least one related market.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Product name'), { target: { value: 'Orbit Desk' } });
    fireEvent.change(screen.getByLabelText('Product folder name'), { target: { value: 'orbit_desk' } });
    fireEvent.click(screen.getByLabelText('Steam'));
    fireEvent.click(screen.getByRole('button', { name: 'Save product' }));

    expect(screen.getByText('Folder name can only contain lowercase letters, digits, and hyphens.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Product folder name'), { target: { value: 'orbit-desk' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save product' }));

    await waitFor(() => {
      expect(screen.queryByText('Folder name can only contain lowercase letters, digits, and hyphens.')).not.toBeInTheDocument();
    });
  });
});
