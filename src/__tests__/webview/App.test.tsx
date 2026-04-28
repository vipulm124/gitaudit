import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import App from '../../webview/App';
import React from 'react';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner when no data', () => {
    render(<App />);
    expect(screen.getByText(/Loading project archaeological data/)).toBeInTheDocument();
  });

  it('renders dashboard when data is loaded', async () => {
    render(<App />);
    
    // Simulate message from extension with correct type and structure
    const mockData = {
      type: 'DATA_LOADED',
      data: {
        version: '1.0.0',
        repoPath: '/mock/repo',
        currentBranch: 'main',
        analyzedAt: new Date().toISOString(),
        metrics: {
          totalCommits: 100,
          totalFiles: 10,
          uniqueAuthors: ['Alice', 'Bob'],
          files: [],
        },
        forbiddenFiles: [],
        authorStats: [],
        scoredFiles: [],
      }
    };

    await act(async () => {
        window.dispatchEvent(new MessageEvent('message', {
            data: mockData
        }));
    });

    // Use findByText to wait for re-render
    const title = await screen.findByText('GitAudit');
    expect(title).toBeInTheDocument();
    expect(screen.getByText('/mock/repo')).toBeInTheDocument();
    expect(screen.getByText(/Total Commits/)).toBeInTheDocument();
  });
});
