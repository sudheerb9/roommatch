import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders chat shell header", () => {
  render(<App />);
  const heading = screen.getByRole("heading", { name: /roommatch chat/i });
  expect(heading).toBeInTheDocument();
});
