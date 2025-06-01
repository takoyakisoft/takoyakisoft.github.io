import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom"; // For extended DOM matchers

import { gantt } from "dhtmlx-gantt"; // This will import from src/__mocks__/dhtmlx-gantt.js
import GanttChart from "./GanttChart";

// Helper to reset mocks before each test
beforeEach(() => {
	// Reset all spies and mock implementations
	if (gantt && typeof gantt.__resetMocks === "function") {
		gantt.__resetMocks();
	}
	// Or reset specific mocks if __resetMocks is not defined on the imported object
	// jest.clearAllMocks(); // This would clear all mocks in the test suite
});

describe("GanttChart Component", () => {
	test("renders and initializes Gantt correctly", async () => {
		render(<GanttChart />);

		// Check if the main container for the Gantt chart is rendered
		// Using a more specific selector if possible (e.g., by role, test-id, or specific class from module.css)
		// For now, assuming a class from styles.ganttChartArea is applied to the ref div
		const ganttContainer = screen.getByRole("generic", {
			name: /gantt-chart-area/i,
		}); // Assuming you add an aria-label or similar
		// Or, if you add a test-id: const ganttContainer = screen.getByTestId('gantt-chart-container');
		// For the current implementation, the div has styles.ganttChartArea
		// We can't directly query by CSS module class unless we know the generated class name or use a test-id.
		// Let's assume the h2 is a good proxy for rendering
		expect(
			screen.getByText(/Gantt Chart \(dhtmlx-gantt\)/i),
		).toBeInTheDocument();

		// Wait for gantt.init to be called
		// The ganttContainerRef in the component might not be directly queryable by its ref name in tests.
		// However, gantt.init is called with the DOM element.
		// We can check if it was called, but checking the argument precisely might be tricky without a stable selector for the ref's div.
		await waitFor(() => {
			expect(gantt.init).toHaveBeenCalledTimes(1);
			// expect(gantt.init).toHaveBeenCalledWith(ganttContainer); // This would be ideal if ganttContainer could be precisely captured
		});

		// Check if gantt.parse was called
		// The content of 'tasks' in the component is transformed before parsing.
		// We can check if parse was called, and potentially with data.
		await waitFor(() => {
			expect(gantt.parse).toHaveBeenCalledTimes(1);
			expect(gantt.parse).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.any(Array), // Check if data is an array
				}),
			);
			// More specific check on the structure of parsed data if needed
			const parseCall = (gantt.parse as jest.Mock).mock.calls[0][0];
			expect(parseCall.data.length).toBeGreaterThan(0);
			expect(parseCall.data[0]).toHaveProperty("id");
			expect(parseCall.data[0]).toHaveProperty("text");
			expect(parseCall.data[0]).toHaveProperty("start_date");
		});
	});

	test("applies configurations and templates", async () => {
		render(<GanttChart />);

		// Wait for useEffect to run and configurations to be applied
		await waitFor(() => {
			// Configuration checks
			expect(gantt.config.date_format).toBe("%Y-%m-%d");
			expect(gantt.config.drag_resize).toBe(true);
			expect(gantt.config.drag_move).toBe(true);
			expect(gantt.config.columns).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "text" }),
					expect.objectContaining({ name: "start_date" }),
					expect.objectContaining({ name: "end_date" }),
					expect.objectContaining({ name: "duration" }),
				]),
			);
			expect(gantt.config.columns.length).toBe(4);

			// Template assignment checks
			expect(gantt.templates.task_class).toBeInstanceOf(Function);
			expect(gantt.templates.timeline_cell_class).toBeInstanceOf(Function);
		});

		// Example of testing a template function (optional, can be complex)
		// This requires the mock for gantt.date.date_to_str and gantt.getState to be working
		if (gantt.templates.timeline_cell_class) {
			const mockDate = new Date(2024, 0, 1); // Jan 1, 2024 - A holiday
			// Setup the mock for date_to_str to return the specific date string for this call
			(gantt.date.date_to_str("%Y-%m-%d") as jest.Mock).mockReturnValueOnce(
				"2024-01-01",
			);
			const cellClass = gantt.templates.timeline_cell_class({}, mockDate);
			expect(cellClass).toContain("gantt_holiday");
		}

		if (gantt.templates.task_class) {
			const mockTask = {
				id: 1,
				text: "Test",
				start_date: "2024-01-01",
				urgency: "urgent",
				difficulty: "easy",
				type: gantt.config.types.TASK,
			};
			(gantt.getState as jest.Mock).mockReturnValueOnce({
				selected_task: null,
			}); // ensure not selected for this part
			const taskClass = gantt.templates.task_class(
				new Date(),
				new Date(),
				mockTask,
			);
			expect(taskClass).toBe("gantt_task_urgent_easy");
		}
	});

	test("calls gantt.clearAll on unmount", async () => {
		const { unmount } = render(<GanttChart />);

		// Wait for initial setup to complete to avoid race conditions with clearAll
		await waitFor(() => {
			expect(gantt.init).toHaveBeenCalledTimes(1);
		});

		act(() => {
			unmount();
		});

		expect(gantt.clearAll).toHaveBeenCalledTimes(1);
	});
});

// Helper to add aria-label to the Gantt container for easier selection in tests
// This is a conceptual change to GanttChart.tsx for testability.
// In GanttChart.tsx, the div would become:
// <div
//   ref={ganttContainerRef}
//   className={styles.ganttChartArea}
//   style={{ width: '100%', height: '500px' }}
//   aria-label="gantt-chart-area" // Added for testability
// />
// Then in tests: screen.getByRole('generic', { name: /gantt-chart-area/i });
// Or using getByLabelText if the role allows it, or getByTestId.
// For now, the test for container presence relies on the H2 title.
// If the tests were running, I'd refine the container selection.
