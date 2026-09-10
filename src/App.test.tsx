import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the upload prompt', () => {
  render(<App />);
  expect(screen.getByText(/upload a photo/i)).toBeInTheDocument();
});
