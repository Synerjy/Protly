import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SubcellularLocation from '../components/SubcellularLocation';

const SAMPLE_LOCATIONS = [
  { location: 'Nucleus', id: 'SL-0191', topology: '', orientation: '', note: '' },
  { location: 'Cytoplasm', id: 'SL-0086', topology: '', orientation: '', note: '' },
  {
    location: 'Cell membrane',
    id: 'SL-0039',
    topology: 'Single-pass type I membrane protein',
    orientation: 'Extracellular side',
    note: 'Isoform 2 only.',
  },
];

describe('SubcellularLocation Component', () => {
  it('renders the card title', () => {
    render(<SubcellularLocation locations={SAMPLE_LOCATIONS} isLoading={false} />);
    expect(screen.getByText('Subcellular Localization')).toBeInTheDocument();
  });

  it('renders all location badges', () => {
    render(<SubcellularLocation locations={SAMPLE_LOCATIONS} isLoading={false} />);
    expect(screen.getByText('Nucleus')).toBeInTheDocument();
    expect(screen.getByText('Cytoplasm')).toBeInTheDocument();
    expect(screen.getByText('Cell membrane')).toBeInTheDocument();
  });

  it('shows the correct location count', () => {
    render(<SubcellularLocation locations={SAMPLE_LOCATIONS} isLoading={false} />);
    expect(screen.getByText('3 locations')).toBeInTheDocument();
  });

  it('renders topology and orientation sub-badges when present', () => {
    render(<SubcellularLocation locations={SAMPLE_LOCATIONS} isLoading={false} />);
    expect(screen.getByText('Single-pass type I membrane protein')).toBeInTheDocument();
    expect(screen.getByText('Extracellular side')).toBeInTheDocument();
  });

  it('renders a truncated note when note text is present', () => {
    render(<SubcellularLocation locations={SAMPLE_LOCATIONS} isLoading={false} />);
    // Note text is short enough to show fully
    expect(screen.getByText('Isoform 2 only.')).toBeInTheDocument();
  });

  it('renders skeleton placeholders in loading state', () => {
    const { container } = render(<SubcellularLocation locations={[]} isLoading={true} />);
    // Should show 3 skeleton divs
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBe(3);
  });

  it('renders nothing when no locations and not loading', () => {
    const { container } = render(<SubcellularLocation locations={[]} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when locations is null', () => {
    const { container } = render(<SubcellularLocation locations={null} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows singular "location" label for a single entry', () => {
    render(<SubcellularLocation locations={[SAMPLE_LOCATIONS[0]]} isLoading={false} />);
    expect(screen.getByText('1 location')).toBeInTheDocument();
  });

  it('shows the UniProtKB source attribution line', () => {
    render(<SubcellularLocation locations={SAMPLE_LOCATIONS} isLoading={false} />);
    expect(screen.getByText(/UniProtKB/i)).toBeInTheDocument();
  });
});
