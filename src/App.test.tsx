import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { describe, it, expect } from "vitest";

describe("App", () => {
	it("renders headline", () => {
		render(
			<MemoryRouter>
				<App />
			</MemoryRouter>,
		);
		const headline = screen.getByText(/ようこそ！ウェブツール集へ/i);
		expect(headline).toBeInTheDocument();
	});
});
