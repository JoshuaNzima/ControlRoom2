import { render, screen } from '@testing-library/react';
import { CoverageMeter } from '@/Components/coverage-meter';

describe('CoverageMeter Component', () => {
  it('renders with default props', () => {
    render(<CoverageMeter value={75} required={10} current={7} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('7/10')).toBeInTheDocument();
  });

  it('shows correct percentage color based on value', () => {
    const { rerender } = render(<CoverageMeter value={95} required={10} current={9} />);
    expect(screen.getByRole('progressbar')).toHaveClass('bg-green-500');

    rerender(<CoverageMeter value={45} required={10} current={4} />);
    expect(screen.getByRole('progressbar')).toHaveClass('bg-yellow-400');

    rerender(<CoverageMeter value={20} required={10} current={2} />);
    expect(screen.getByRole('progressbar')).toHaveClass('bg-red-500');
  });

  it('handles custom sizes', () => {
    const { rerender } = render(<CoverageMeter value={75} required={10} current={7} size="sm" />);
    expect(screen.getByRole('progressbar')).toHaveClass('h-1.5');

    rerender(<CoverageMeter value={75} required={10} current={7} size="lg" />);
    expect(screen.getByRole('progressbar')).toHaveClass('h-3');
  });

  it('shows optional label when provided', () => {
    render(<CoverageMeter value={75} required={10} current={7} label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('hides numbers when showNumbers is false', () => {
    render(<CoverageMeter value={75} required={10} current={7} showNumbers={false} />);
    expect(screen.queryByText('7/10')).not.toBeInTheDocument();
  });

  it('clamps value between 0 and 100', () => {
    const { rerender } = render(<CoverageMeter value={150} required={10} current={15} />);
    expect(screen.getByRole('progressbar')).toHaveStyle({ width: '100%' });

    rerender(<CoverageMeter value={-50} required={10} current={0} />);
    expect(screen.getByRole('progressbar')).toHaveStyle({ width: '0%' });
  });
});