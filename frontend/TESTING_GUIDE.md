# Frontend Testing Guide 🧪

This document outlines the testing conventions, libraries, and instructions for writing tests in the Protly Frontend React application.

## Libraries & Stack

We use the modern Vite testing ecosystem:

1. **[Vitest](https://vitest.dev/)**: Our test runner. It is natively integrated with Vite, which means tests run blazingly fast and share the exact same configuration as the production bundler.
2. **[React Testing Library (RTL)](https://testing-library.com/docs/react-testing-library/intro/)**: Used for rendering React components in a virtual DOM (`jsdom`) and querying them the same way a user would (e.g., finding buttons by their text).
3. **[user-event](https://testing-library.com/docs/user-event/intro)**: A companion to RTL that accurately simulates user interactions like typing, clicking, and tab navigation.

---

## How to Run the Tests

To run the entire test suite once:

```bash
npm run test
```

To run tests in **Watch Mode** (automatically re-runs tests when you save a file):

```bash
npm run test:watch
```

To enforce code style alongside your tests:

```bash
npm run lint      # Checks for code issues
npm run format    # Auto-formats code with Prettier
```

---

## How to Write a Test

1. **Where to place tests**: Create a new file inside the `src/tests/` folder.
2. **Naming convention**: Name the file exactly like the component you are testing, appending `.test.jsx`. For example: `components/Button.jsx` → `tests/Button.test.jsx`.

### Example Test (Component Rendering & Interaction)

```jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import SequenceInput from '../components/SequenceInput';

describe('SequenceInput Component', () => {
  // 1. Testing simple rendering
  it('renders correctly', () => {
    // Render the component with some mock props
    render(
      <SequenceInput sequence="" setSequence={() => {}} onPredict={() => {}} status="ready" />
    );

    // Check if what the user sees is on screen
    expect(screen.getByPlaceholderText(/Paste your amino-acid sequence/i)).toBeInTheDocument();
  });

  // 2. Testing user interactions
  it('fires predict event on valid click', async () => {
    const mockPredict = vi.fn(); // Create a spy function
    const user = userEvent.setup(); // Setup user interaction

    render(
      <SequenceInput
        sequence="ARNDCQEGHILKMFPSTWYV"
        setSequence={() => {}}
        onPredict={mockPredict}
        status="ready"
      />
    );

    // Find the button and click it
    const btn = screen.getByRole('button', { name: /Predict/i });
    await user.click(btn);

    // Assert the function was called!
    expect(mockPredict).toHaveBeenCalled();
  });
});
```

### Best Practices

- **Query by Accessibility**: Prefer `getByRole`, `getByLabelText`, and `getByText`. Avoid querying by CSS classes, as tests should test functionality, not DOM structure.
- **Mock External Hooks**: If your component relies on global state or context hooks, mock the hook using `vi.spyOn` so you can test the component in isolation.
