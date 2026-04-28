import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AuthorStatDisplay from '../../webview/components/AuthorStatDisplay';

describe('AuthorStatDisplay', () => {
  it('renders author names', () => {
    render(<AuthorStatDisplay filteredAuthors={[{ author: 'Alice', authorEmail: 'a@t.com', commitCounts: 10, files: [] }]} expandedAuthor={null} searchTerm="" toggleAuthor={vi.fn()} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
