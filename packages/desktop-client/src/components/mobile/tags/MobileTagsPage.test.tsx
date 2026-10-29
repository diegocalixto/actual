import React from 'react';
import { MemoryRouter } from 'react-router';

import type { TagEntity } from '@actual-app/core/types/models';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useNavigate } from '#hooks/useNavigate';
import { createTestQueryClient, TestProviders } from '#mocks';
import { tagQueries } from '#tags';

import { MobileTagsPage } from './MobileTagsPage';
import { getTagNameProblem } from './tagRules';

vi.mock('@use-gesture/react', () => ({
  useDrag: vi.fn().mockReturnValue(() => ({})),
}));
vi.mock('#hooks/useNavigate');

const mockTags: TagEntity[] = [
  { id: 'tag-1', tag: 'trip', color: '#1976D2', description: 'Holidays' },
  { id: 'tag-2', tag: 'work', color: null, description: '' },
  { id: 'tag-3', tag: 'old', color: null, description: '', hidden: true },
];

describe('MobileTagsPage', () => {
  const mockNavigate = vi.fn();
  const queryClient = createTestQueryClient();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    queryClient.setQueryData(tagQueries.list().queryKey, mockTags);
  });

  const renderPage = (path = '/tags') =>
    render(
      <TestProviders queryClient={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <MobileTagsPage />
        </MemoryRouter>
      </TestProviders>,
    );

  it('lists visible tags and leaves hidden ones out by default', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /tags/i })).toBeInTheDocument();
    expect(screen.getByText('#trip')).toBeInTheDocument();
    expect(screen.getByText('#work')).toBeInTheDocument();
    expect(screen.queryByText('#old')).not.toBeInTheDocument();
  });

  it('filters tags by name', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText(/filter tags/i), 'tri');

    expect(screen.getByText('#trip')).toBeInTheDocument();
    expect(screen.queryByText('#work')).not.toBeInTheDocument();
  });

  it('opens a tag in the edit form', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('#trip'));

    expect(mockNavigate).toHaveBeenCalledWith('/tags?tag=tag-1');
  });

  it('shows the empty state when there are no tags', () => {
    queryClient.setQueryData(tagQueries.list().queryKey, []);
    renderPage();

    expect(screen.getByText('No tags')).toBeInTheDocument();
  });

  it('keeps the name of an existing tag read-only', () => {
    renderPage('/tags?tag=tag-1');

    expect(
      screen.getByRole('heading', { name: /edit tag/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeDisabled();
    expect(screen.getByLabelText('Description')).toHaveValue('Holidays');
  });
});

describe('getTagNameProblem', () => {
  it('applies the desktop rules', () => {
    expect(getTagNameProblem('', [])).toBe('empty');
    expect(getTagNameProblem('a#b', [])).toBe('invalid');
    expect(getTagNameProblem('trip', ['trip'])).toBe('duplicate');
    expect(getTagNameProblem('trip2', ['trip'])).toBeNull();
  });
});
