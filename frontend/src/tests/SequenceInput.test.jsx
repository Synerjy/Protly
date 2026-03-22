import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import SequenceInput from '../components/SequenceInput';

describe('SequenceInput Component', () => {
  it('renders the textarea successfully', () => {
    render(
      <SequenceInput sequence="" setSequence={() => {}} onPredict={() => {}} status="ready" />
    );
    expect(screen.getByPlaceholderText(/Paste your amino-acid sequence here/i)).toBeInTheDocument();
  });

  it('flags invalid amino acids correctly', () => {
    // Passes an invalid sequence prop: "MACXGOP"
    render(
      <SequenceInput
        sequence="MACXGOP"
        setSequence={() => {}}
        onPredict={() => {}}
        status="ready"
      />
    );
    expect(screen.getByText(/Invalid amino-acid characters:/i)).toBeInTheDocument();
    // 'O' and 'X' are not standard amino acids
    expect(screen.getByText(/O, X/i)).toBeInTheDocument();
  });

  it('disables the predict button if sequence is too short', () => {
    // 3 characters, minimum is 10
    render(
      <SequenceInput sequence="MAC" setSequence={() => {}} onPredict={() => {}} status="ready" />
    );
    const btn = screen.getByRole('button', { name: /Predict/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/Min 10 required/i)).toBeInTheDocument();
  });

  it('calls onPredict when sequence is valid and predict is clicked', async () => {
    const mockPredict = vi.fn();
    const user = userEvent.setup();
    render(
      <SequenceInput
        sequence="ARNDCQEGHILKMFPSTWYV"
        setSequence={() => {}}
        onPredict={mockPredict}
        status="ready"
      />
    );

    const btn = screen.getByRole('button', { name: /Predict/i });
    expect(btn).not.toBeDisabled();

    await user.click(btn);
    expect(mockPredict).toHaveBeenCalled();
  });
});
