import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeatmapGraph from '../../webview/components/HeatmapGraph';
import React from 'react';

describe('HeatmapGraph', () => {
  it('renders title and legend', () => {
    render(<HeatmapGraph files={[]} />);
    expect(screen.getByText('Risk Treemap')).toBeInTheDocument();
  });

  it('shows footer stats even when empty', () => {
    render(<HeatmapGraph files={[]} />);
    expect(screen.getByText(/0 total files/)).toBeInTheDocument();
  });
});
