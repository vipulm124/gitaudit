import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ForbiddenFilesDisplay from '../../webview/components/ForbiddenFilesDisplay';

describe('ForbiddenFilesDisplay', () => {
  it('shows empty state message', () => {
    render(<ForbiddenFilesDisplay filteredForbidden={[]} />);
    expect(screen.getByText(/No critical flags/)).toBeInTheDocument();
  });
});
