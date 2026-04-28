import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import FileMetricsDisplay from '../../webview/components/FileMetricsDisplay';

describe('FileMetricsDisplay', () => {
  it('renders file cards', () => {
    render(<FileMetricsDisplay filteredFiles={[{ path: 'test.ts', totalCommits: 10, uniqueAuthors: ['A'], lastCommitDate: '2025-01-01', daysSinceLastCommit: 10, firstCommitDate: '2024-01-01', ageInDays: 365, bugFixCommits: 0, bugFixRatio: 0 } as any]} totalCommits={100} />);
    expect(screen.getByText('test.ts')).toBeInTheDocument();
  });
});
