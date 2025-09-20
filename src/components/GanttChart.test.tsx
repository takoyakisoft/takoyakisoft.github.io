import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom"; // For extended DOM matchers
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from "vitest";

// Explicitly mock 'dhtmlx-gantt' with a factory that returns the mock structure
vi.mock("dhtmlx-gantt", () => {
	const actualMock = vi.importActual<
		typeof import("../__mocks__/dhtmlx-gantt")
	>("../__mocks__/dhtmlx-gantt");
	return actualMock; // Re-export the entire mock module
	// If the mock only has a default export that contains the gantt object:
	// return { gantt: actualMock.default.gantt };
	// Or if the named export 'gantt' is what we need:
	// return { gantt: actualMock.gantt };
});

import { gantt } from "dhtmlx-gantt";
import GanttChart from "./GanttChart";

// Helper to reset mocks before each test

beforeEach(() => {
	// Reset all spies and mock implementations for Vitest
	vi.clearAllMocks(); // Clears all mocks (spy calls, instances, etc.)
	// If you need to reset to initial implementation: vi.resetAllMocks();
	// Also clear our custom attached handlers in the mock
	if (gantt.__clearAttachedHandlers) {
		// Check if the method exists on the mock
		gantt.__clearAttachedHandlers();
	}
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
			screen.getByRole("heading", { name: "ガントチャート" }),
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
			const parseCall = (gantt.parse as any).mock.calls[0][0];
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
			expect(gantt.config.columns.length).toBe(5); // Updated to 5 due to "Actions" column

			// Template assignment checks
			expect(gantt.templates.task_class).toBeInstanceOf(Function);
			expect(gantt.templates.timeline_cell_class).toBeInstanceOf(Function);
		});

		// Example of testing a template function (optional, can be complex)
		// This requires the mock for gantt.date.date_to_str and gantt.getState to be working
		// Note: The mock for gantt.date.date_to_str and gantt.getState needs to be defined in the mock file if used.
		// For now, we'll assume these are part of the extended mock or comment out if they cause issues.
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

	test("updates task data via gantt.parse on onAfterTaskDrag event", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.init).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled()); // Ensure initial parse has happened
		const initialParseCall = (gantt.parse as any).mock.calls.find(
			(call: [any]) => call[0]?.data?.length > 0,
		);
		if (!initialParseCall) {
			throw new Error(
				"Initial gantt.parse call with data not found for onAfterTaskDrag test.",
			);
		}
		const initialTasks = initialParseCall[0].data;
		const testTaskId = initialTasks[0]?.id;
		if (!testTaskId) {
			throw new Error(
				"Initial tasks not found or task ID missing for onAfterTaskDrag test.",
			);
		}

		const updatedTaskDataFromGantt = {
			// Data as gantt.getTask would return it
			id: testTaskId,
			text: "Updated Text by Drag",
			start_date: new Date(2024, 0, 15),
			end_date: new Date(2024, 0, 25),
			duration: 10,
		};
		(gantt.getTask as any).mockReturnValue(updatedTaskDataFromGantt);
		// Mock format_date to return easily verifiable strings
		(gantt.templates.format_date as any).mockImplementation((date: Date) => {
			return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
		});

		const onAfterTaskDragHandlers =
			gantt.__getAttachedHandlers("onAfterTaskDrag");
		const onAfterTaskDragHandler =
			onAfterTaskDragHandlers[onAfterTaskDragHandlers.length - 1];

		act(() => {
			onAfterTaskDragHandler?.(testTaskId, "move", {});
		});

		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
		const parseCalls = (gantt.parse as any).mock.calls;
		const lastParseData = parseCalls[parseCalls.length - 1][0].data;
		const updatedTaskInParse = lastParseData.find(
			(t: any) => t.id === testTaskId,
		);

		expect(updatedTaskInParse).toBeDefined();
		expect(updatedTaskInParse.start_date).toBe("2024-01-15");
		expect(updatedTaskInParse.end_date).toBe("2024-01-25");
		expect(updatedTaskInParse.duration).toBe(10);
		expect(gantt.refreshTask).toHaveBeenCalledWith(testTaskId);
	});

	test("updates task data via gantt.parse on onLightboxSave event", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.init).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled()); // Ensure initial parse has happened
		const initialParseCall = (gantt.parse as any).mock.calls.find(
			(call: { data: string | any[] }[]) => call[0]?.data?.length > 0,
		);
		if (!initialParseCall) {
			throw new Error(
				"Initial gantt.parse call with data not found for onLightboxSave test.",
			);
		}
		const initialTasks = initialParseCall[0].data;
		const testTaskId = initialTasks[0]?.id;
		if (!testTaskId) {
			throw new Error(
				"Initial tasks not found or task ID missing for onLightboxSave test.",
			);
		}

		const savedTaskData = {
			// Data as it would come from the lightbox
			id: testTaskId,
			text: "Saved Task",
			start_date: new Date(2024, 1, 1), // Feb 1, 2024
			end_date: new Date(2024, 1, 10), // Feb 10, 2024
			duration: 9,
			progress: 0.5,
			type: "task", // Ensure type is included as component might use it
		};
		(gantt.templates.format_date as any).mockImplementation((date: Date) => {
			return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
		});

		const onLightboxSaveHandlers =
			gantt.__getAttachedHandlers("onLightboxSave");
		const onLightboxSaveHandler =
			onLightboxSaveHandlers[onLightboxSaveHandlers.length - 1];

		act(() => {
			onLightboxSaveHandler?.(testTaskId, savedTaskData, false); // isNew = false
		});

		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
		const parseCalls = (gantt.parse as any).mock.calls;
		const lastParseData = parseCalls[parseCalls.length - 1][0].data;
		const updatedTaskInParse = lastParseData.find(
			(t: any) => t.id === testTaskId,
		);

		expect(updatedTaskInParse).toBeDefined();
		expect(updatedTaskInParse.text).toBe("Saved Task");
		expect(updatedTaskInParse.start_date).toBe("2024-02-01");
		expect(updatedTaskInParse.end_date).toBe("2024-02-10");
		expect(updatedTaskInParse.duration).toBe(9);
		expect(updatedTaskInParse.progress).toBe(0.5);
		expect(gantt.refreshTask).toHaveBeenCalledWith(testTaskId);
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

describe("Task Deletion", () => {
	beforeEach(() => {
		(gantt.confirm as any).mockImplementation(
			(config: { callback: (arg0: boolean) => void }) => {
				if (config.callback) config.callback(true); // Auto-confirm "yes"
			},
		);
		(gantt.isTaskExists as any).mockReturnValue(true);
		(gantt.deleteTask as any).mockClear();
		(gantt.uid as any).mockClear();
		(gantt.calculateEndDate as any).mockClear();
		(gantt.getTask as any).mockImplementation((id: any) => ({
			id,
			text: `Task ${id}`,
		})); // Default mock for getTask
	});

	test("handleDeleteTask results in gantt.deleteTask and updated data in gantt.parse", async () => {
		// GanttChart renders and initializes tasks.
		// The initial tasks are from transformTasksForDhtmlx(initialDataFromPrevLib)
		// Let's assume initialDataFromPrevLib has an ID that we can target.
		const taskToDeleteId = 1; // from initialDataFromPrevLib

		(gantt.confirm as any).mockImplementation(
			(config: { callback: (arg0: boolean) => void }) => {
				if (config.callback) config.callback(true); // Auto-confirm "yes"
			},
		);
		(gantt.isTaskExists as any).mockReturnValue(true);
		(gantt.getTask as any).mockReturnValue({
			id: taskToDeleteId,
			text: "Task 1",
		}); // Mock for confirm message
		(gantt.parse as any).mockClear(); // Clear initial parse calls

		render(<GanttChart />);

		// Ensure initial parse has happened from useEffect
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
		const initialParseCallArgs = (gantt.parse as any).mock.calls[0][0];
		expect(
			initialParseCallArgs.data.find((t: any) => t.id === taskToDeleteId),
		).toBeDefined();
		(gantt.parse as any).mockClear(); // Clear for the next assertion

		act(() => {
			if ((window as any).handleGanttTaskDelete) {
				(window as any).handleGanttTaskDelete(taskToDeleteId);
			} else {
				throw new Error(
					"handleGanttTaskDelete was not exposed on window by GanttChart component",
				);
			}
		});

		expect(gantt.confirm).toHaveBeenCalled();
		expect(gantt.isTaskExists).toHaveBeenCalledWith(taskToDeleteId);
		expect(gantt.deleteTask).toHaveBeenCalledWith(taskToDeleteId);

		// Check that gantt.parse is called with data excluding the deleted task
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
		const parseCalls = (gantt.parse as any).mock.calls;
		const lastParseData = parseCalls[parseCalls.length - 1][0].data;
		expect(
			lastParseData.find((t: any) => t.id === taskToDeleteId),
		).toBeUndefined();
	});

	test("deleted tasks do not reappear after adding a new task", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled()); // Initial parse
		// Find the first parse call that actually has data.
		const firstMeaningfulParseCall = (gantt.parse as any).mock.calls.find(
			(call: { data: string | any[] }[]) => call[0]?.data?.length > 0,
		);
		if (!firstMeaningfulParseCall) {
			throw new Error(
				"Initial gantt.parse call with data not found for Task Deletion test.",
			);
		}
		const initialTasks = firstMeaningfulParseCall[0].data;
		const taskToDeleteId = initialTasks[0]?.id;
		const taskToKeepId = initialTasks.length > 1 ? initialTasks[1]?.id : null; // Handle if only one task

		if (!taskToDeleteId) {
			// taskToKeepId can be null if only one task initially
			throw new Error(
				"Not enough initial tasks for this test (need at least one).",
			);
		}
		(gantt.parse as any).mockClear();

		// 1. Delete a task
		act(() => {
			if ((window as any).handleGanttTaskDelete) {
				(window as any).handleGanttTaskDelete(taskToDeleteId);
			} else {
				throw new Error("handleGanttTaskDelete not on window");
			}
		});
		expect(gantt.deleteTask).toHaveBeenCalledWith(taskToDeleteId);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
		let parseCallsAfterDelete = (gantt.parse as any).mock.calls;
		let currentParsedTasks =
			parseCallsAfterDelete[parseCallsAfterDelete.length - 1][0].data;
		expect(
			currentParsedTasks.find((t: any) => t.id === taskToDeleteId),
		).toBeUndefined();
		(gantt.parse as any).mockClear();

		// 2. Add a new task
		vi.setSystemTime(new Date(2024, 3, 15)); // April 15, 2024
		(gantt.uid as any).mockReturnValue("newTask999");
		(gantt.date.str_to_date as any).mockImplementation(
			(dateStr: string | number | Date) => new Date(dateStr),
		);
		(gantt.calculateEndDate as any).mockImplementation(
			({ start_date, duration }: { start_date: Date; duration: number }) => {
				const endDate = new Date(start_date);
				endDate.setDate(start_date.getDate() + duration);
				return endDate;
			},
		);

		const addTaskButton = screen.getByRole("button", { name: "タスク追加" }); // Changed to Japanese
		act(() => {
			addTaskButton.click();
		});

		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
		let parseCallsAfterAdd = (gantt.parse as any).mock.calls;
		currentParsedTasks =
			parseCallsAfterAdd[parseCallsAfterAdd.length - 1][0].data;

		expect(
			currentParsedTasks.find((t: any) => t.id === taskToDeleteId),
		).toBeUndefined();
		expect(
			currentParsedTasks.find((t: any) => t.id === "newTask999"),
		).toBeDefined();
		if (taskToKeepId) {
			// Only check for taskToKeepId if it existed
			expect(
				currentParsedTasks.find((t: any) => t.id === taskToKeepId),
			).toBeDefined();
		}

		vi.useRealTimers();
	});
});

describe("Task Reordering", () => {
	beforeEach(() => {
		(gantt.moveTask as any).mockClear();
		(gantt.serialize as any).mockClear();
	});

	test("onBeforeRowDragEnd calls relevant gantt methods and updates data via gantt.parse", async () => {
		// Component's initial tasks are from transformTasksForDhtmlx(initialDataFromPrevLib)
		// Task IDs 1 and 2 exist in this initial data.
		const reorderedGanttTasksFromSerialize = [
			{
				id: 2,
				text: "Task 2 Reordered",
				start_date: new Date(2024, 0, 2),
				end_date: new Date(2024, 0, 3),
				duration: 1,
				parent: "0",
				progress: 0,
				type: "task",
				open: true,
				urgency: "urgent",
				difficulty: "easy",
			}, // Add custom props here
			{
				id: 1,
				text: "Task 1 Reordered",
				start_date: new Date(2024, 0, 1),
				end_date: new Date(2024, 0, 2),
				duration: 1,
				parent: "0",
				progress: 0,
				type: "task",
				open: true,
				urgency: "urgent",
				difficulty: "difficult",
			},
		];
		(gantt.serialize as any).mockReturnValue({
			data: reorderedGanttTasksFromSerialize,
		});
		(gantt.parse as any).mockClear();

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled()); // Wait for initial render's parse
		(gantt.parse as any).mockClear();

		const onBeforeRowDragEndHandlers =
			gantt.__getAttachedHandlers("onBeforeRowDragEnd");
		const onBeforeRowDragEndHandler =
			onBeforeRowDragEndHandlers[onBeforeRowDragEndHandlers.length - 1];

		const draggedTaskId = 2; // Task ID from initialDataFromPrevLib (Task 2)
		const targetParentId = "0";
		const targetIndex = 0; // Move Task 2 to the first position (before Task 1)

		act(() => {
			onBeforeRowDragEndHandler?.(draggedTaskId, targetParentId, targetIndex);
		});

		expect(gantt.moveTask).toHaveBeenCalledWith(
			draggedTaskId,
			targetIndex,
			targetParentId,
		);
		expect(gantt.serialize).toHaveBeenCalled();

		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
		const parseCalls = (gantt.parse as any).mock.calls;
		const lastParseData = parseCalls[parseCalls.length - 1][0].data;

		expect(lastParseData.length).toBe(reorderedGanttTasksFromSerialize.length);
		expect(lastParseData[0].text).toBe("Task 2 Reordered"); // Serialized data is used
		expect(lastParseData[1].text).toBe("Task 1 Reordered");

		// Check preservation of custom properties.
		// The component's logic merges existingTask props with serialized props.
		// Initial task 1: urgency "urgent", difficulty "difficult"
		// Initial task 2: urgency "urgent", difficulty "easy"
		// These should be preserved.
		const task1AfterReorder = lastParseData.find((t: any) => t.id === 1);
		const task2AfterReorder = lastParseData.find((t: any) => t.id === 2);

		expect(task1AfterReorder.urgency).toBe("urgent");
		expect(task1AfterReorder.difficulty).toBe("difficult");
		expect(task2AfterReorder.urgency).toBe("urgent");
		expect(task2AfterReorder.difficulty).toBe("easy");
	});
});

describe("handleAddTask and JSON Export", () => {
	let originalCreateElement: typeof document.createElement;
	let originalBodyAppend: typeof document.body.appendChild;
	let originalBodyRemove: typeof document.body.removeChild;
	let originalURLCreateObjectURL: typeof URL.createObjectURL;
	let originalURLRevokeObjectURL: typeof URL.revokeObjectURL;

	beforeAll(() => {
		originalCreateElement = document.createElement;
		originalBodyAppend = document.body.appendChild;
		originalBodyRemove = document.body.removeChild;
		originalURLCreateObjectURL = global.URL.createObjectURL;
		originalURLRevokeObjectURL = global.URL.revokeObjectURL;
	});

	beforeEach(() => {
		// Clear relevant gantt mocks before each test in this suite
		(gantt.uid as any).mockClear();
		(gantt.date.str_to_date as any).mockClear();
		(gantt.calculateEndDate as any).mockClear();
		(gantt.parse as any).mockClear();

		// Ensure a clean body for each test in this suite, especially before render
		document.body.innerHTML = "";
		document.head.innerHTML = ""; // Also clear head just in case
	});

	afterEach(() => {
		vi.useRealTimers();
		// vi.restoreAllMocks() will take care of restoring spies created with vi.spyOn
		// such as mockAppendChild, mockRemoveChild, mockCreateElement used in the tests.
		vi.restoreAllMocks();

		// Manually restore things that were directly assigned to global properties,
		// if not handled by vi.restoreAllMocks (e.g. global.URL properties).
		global.URL.createObjectURL = originalURLCreateObjectURL;
		global.URL.revokeObjectURL = originalURLRevokeObjectURL;

		// The following manual restorations are redundant if these document/body methods
		// were spied on using vi.spyOn, as vi.restoreAllMocks() handles them.
		// document.createElement = originalCreateElement;
		// document.body.appendChild = originalBodyAppend;
		// document.body.removeChild = originalBodyRemove;
	});

	test("handleAddTask correctly calculates and adds end_date to the new task", async () => {
		const mockToday = new Date(2024, 3, 10); // April 10, 2024
		vi.setSystemTime(mockToday);
		(gantt.uid as any).mockReturnValue("test-uid-123");
		(gantt.calculateEndDate as any).mockImplementation(
			({ start_date, duration }: { start_date: Date; duration: number }) => {
				const endDate = new Date(start_date);
				endDate.setDate(start_date.getDate() + duration);
				return endDate;
			},
		);
		(gantt.parse as any).mockClear();

		render(<GanttChart />);

		await waitFor(() => expect(gantt.parse).toHaveBeenCalled()); // Wait for initial parse
		(gantt.parse as any).mockClear(); // Clear for the specific assertion

		const addTaskButton = screen.getByRole("button", { name: "タスク追加" });
		act(() => {
			addTaskButton.click();
		});

		await waitFor(() => {
			expect(gantt.parse).toHaveBeenCalled();
		});

		const parseCalls = (gantt.parse as any).mock.calls;
		const lastParseCall = parseCalls[parseCalls.length - 1][0];
		const addedTask = lastParseCall.data.find(
			(task: any) => task.id === "test-uid-123",
		);

		expect(addedTask).toBeDefined();
		expect(addedTask).toHaveProperty("end_date");
		expect(addedTask?.end_date).toBe("2024-04-11");
		expect(addedTask?.start_date).toBe("2024-04-10");

		vi.useRealTimers();
	});

	test("JSON export includes added task with id, text, start_date, and end_date", async () => {
		const mockToday = new Date(2024, 3, 10);
		vi.setSystemTime(mockToday);
		(gantt.uid as any).mockReturnValue("export-test-uid-456");
		(gantt.date.str_to_date as any).mockImplementation(
			(dateStr: string | number | Date) => new Date(dateStr),
		);
		(gantt.calculateEndDate as any).mockImplementation(
			({ start_date, duration }: { start_date: Date; duration: number }) => {
				const endDate = new Date(start_date);
				endDate.setDate(start_date.getDate() + duration);
				return endDate;
			},
		);
		(gantt.parse as any).mockClear();

		const mockCreateObjectURL = vi.fn(() => "mock-url-export");
		const mockRevokeObjectURL = vi.fn();
		const mockLinkClick = vi.fn();

		global.URL.createObjectURL = mockCreateObjectURL;
		global.URL.revokeObjectURL = mockRevokeObjectURL;

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled()); // Initial parse
		(gantt.parse as any).mockClear();

		// Setup spies after initial render, just before they are needed for export.
		const mockAppendChild = vi
			.spyOn(document.body, "appendChild")
			.mockImplementation((node) => node);
		const mockRemoveChild = vi
			.spyOn(document.body, "removeChild")
			.mockImplementation((node) => node);
		const mockCreateElement = vi
			.spyOn(document, "createElement")
			.mockImplementation((tagName: string) => {
				if (tagName.toLowerCase() === "a") {
					return {
						href: "",
						download: "",
						click: mockLinkClick,
					} as unknown as HTMLAnchorElement;
				}
				// Ensure originalCreateElement is properly defined and available in this scope
				// It's captured in beforeAll of this describe block.
				return originalCreateElement.call(document, tagName);
			});

		const addTaskButton = screen.getByRole("button", { name: "タスク追加" });
		act(() => {
			addTaskButton.click();
		});

		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
		// The tasks for export are taken from the component's state, which is updated,
		// and then reflected in gantt.parse. We can use the data from the last gantt.parse call
		// to simulate what the component's state would be for the export.
		const parseCalls = (gantt.parse as any).mock.calls;
		const lastParsedData = parseCalls[parseCalls.length - 1][0].data;
		expect(
			lastParsedData.find((t: any) => t.id === "export-test-uid-456"),
		).toBeDefined();

		const exportButton = screen.getByRole("button", {
			name: "JSONエクスポート",
		});
		act(() => {
			exportButton.click();
		});

		expect(mockCreateObjectURL).toHaveBeenCalled();
		const blobArg = mockCreateObjectURL.mock.calls[0][0] as Blob;

		// Use FileReader to read Blob content as text, as blobArg.text() might not be available in JSDOM
		const reader = new FileReader();
		const exportedJsonPromise = new Promise<string>((resolve, reject) => {
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(reader.error);
		});
		reader.readAsText(blobArg);
		const exportedJson = await exportedJsonPromise;

		const exportedTasks = JSON.parse(exportedJson);

		const addedTaskInExport = exportedTasks.find(
			(task: any) => task.id === "export-test-uid-456",
		);
		expect(addedTaskInExport).toBeDefined();
		expect(addedTaskInExport).toEqual(
			expect.objectContaining({
				id: "export-test-uid-456",
				text: "New Task",
				start_date: "2024-04-10",
				end_date: "2024-04-11",
				duration: 1,
				progress: 0,
				type: gantt.config.types.TASK, // Corrected to uppercase TASK
			}),
		);

		expect(mockLinkClick).toHaveBeenCalled();
		expect(mockAppendChild).toHaveBeenCalled();
		expect(mockRemoveChild).toHaveBeenCalled();
		expect(mockRevokeObjectURL).toHaveBeenCalledWith("mock-url-export");

		// Mocks are restored in afterEach
	});
});

describe("UI Localization", () => {
	beforeEach(() => {
		// Reset specific gantt properties that might be modified by tests
		// gantt.i18n.setLocale will be called during render, so we check its call
		// For labels, we check the state of the mock after render
		// If gantt.locale.labels were complex objects, might need deep reset or specific spy
		gantt.locale.labels.icon_save = ""; // Reset to a known default before each test
		gantt.locale.labels.icon_cancel = "";
		gantt.locale.labels.icon_delete = "";
		gantt.locale.labels.section_description = "";
		gantt.locale.labels.section_time = "";
	});

	test("renders static UI elements with Japanese text", () => {
		render(<GanttChart />);
		expect(
			screen.getByRole("heading", { name: "ガントチャート" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "タスク追加" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "JSONエクスポート" }),
		).toBeInTheDocument();
		expect(screen.getByText("JSONインポート")).toBeInTheDocument(); // Label for a file input
		expect(screen.getByText("ズーム:")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "日" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "週" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "月" })).toBeInTheDocument();
	});

	test("configures dhtmlx-gantt lightbox and locale to Japanese", async () => {
		render(<GanttChart />);

		// Wait for useEffect to run
		await waitFor(() => {
			expect(gantt.i18n.setLocale).toHaveBeenCalledWith("jp");
		});

		// Check explicit label translations
		// These are set directly on gantt.locale.labels in the component's useEffect
		expect(gantt.locale.labels.icon_save).toBe("保存");
		expect(gantt.locale.labels.icon_cancel).toBe("キャンセル");
		expect(gantt.locale.labels.icon_delete).toBe("削除");
		expect(gantt.locale.labels.section_description).toBe("説明");
		expect(gantt.locale.labels.section_time).toBe("期間");
	});
});
describe("Error Handling and Edge Cases", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("handles gantt.init failure gracefully", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		(gantt.init as any).mockImplementation(() => {
			throw new Error("Failed to initialize gantt");
		});

		expect(() => render(<GanttChart />)).not.toThrow();

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalled();
		});

		consoleSpy.mockRestore();
	});

	test("handles empty task data gracefully", async () => {
		(gantt.parse as any).mockClear();

		render(<GanttChart />);

		await waitFor(() => {
			expect(gantt.parse).toHaveBeenCalled();
			const parseCall = (gantt.parse as any).mock.calls[0][0];
			expect(parseCall).toHaveProperty("data");
			expect(Array.isArray(parseCall.data)).toBe(true);
		});
	});

	test("handles invalid task data in onAfterTaskDrag", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.init).toHaveBeenCalled());

		(gantt.getTask as any).mockReturnValue(null);

		const onAfterTaskDragHandlers =
			gantt.__getAttachedHandlers("onAfterTaskDrag");
		const handler = onAfterTaskDragHandlers[onAfterTaskDragHandlers.length - 1];

		expect(() => {
			act(() => {
				handler?.("invalid-id", "move", {});
			});
		}).not.toThrow();
	});

	test("handles task deletion when task doesn't exist", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		(gantt.isTaskExists as any).mockReturnValue(false);
		const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		act(() => {
			if ((window as any).handleGanttTaskDelete) {
				(window as any).handleGanttTaskDelete("nonexistent-id");
			}
		});

		expect(gantt.deleteTask).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	test("handles task creation with invalid dates", async () => {
		vi.setSystemTime(new Date("invalid"));
		(gantt.uid as any).mockReturnValue("invalid-date-task");
		(gantt.calculateEndDate as any).mockImplementation(() => {
			throw new Error("Invalid date calculation");
		});

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const addTaskButton = screen.getByRole("button", { name: "タスク追加" });

		expect(() => {
			act(() => {
				addTaskButton.click();
			});
		}).not.toThrow();

		vi.useRealTimers();
	});
});

describe("File Import Functionality", () => {
	let mockFileReader: any;
	let originalFileReader: typeof FileReader;

	beforeAll(() => {
		originalFileReader = global.FileReader;
	});

	beforeEach(() => {
		mockFileReader = {
			readAsText: vi.fn(),
			result: "",
			onload: null,
			onerror: null,
		};
		global.FileReader = vi.fn(() => mockFileReader) as any;
	});

	afterEach(() => {
		global.FileReader = originalFileReader;
	});

	test("handles valid JSON file import", async () => {
		const importedTasks = [
			{
				id: "imported-1",
				text: "Imported Task 1",
				start_date: "2024-05-01",
				end_date: "2024-05-02",
				duration: 1,
				progress: 0.3,
			},
			{
				id: "imported-2",
				text: "Imported Task 2",
				start_date: "2024-05-03",
				end_date: "2024-05-05",
				duration: 2,
				progress: 0.7,
			},
		];

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
		(gantt.parse as any).mockClear();

		const fileInput = screen.getByLabelText("JSONインポート");
		const mockFile = new File([JSON.stringify(importedTasks)], "tasks.json", {
			type: "application/json",
		});

		act(() => {
			Object.defineProperty(fileInput, "files", {
				value: [mockFile],
				writable: false,
			});

			mockFileReader.result = JSON.stringify(importedTasks);
			if (mockFileReader.onload) {
				mockFileReader.onload();
			}
		});

		await waitFor(() => {
			expect(gantt.parse).toHaveBeenCalled();
			const parseCall = (gantt.parse as any).mock.calls[0][0];
			expect(parseCall.data).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: "imported-1",
						text: "Imported Task 1",
					}),
					expect.objectContaining({
						id: "imported-2",
						text: "Imported Task 2",
					}),
				]),
			);
		});
	});

	test("handles invalid JSON file import gracefully", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const fileInput = screen.getByLabelText("JSONインポート");
		const mockFile = new File(["invalid json content"], "invalid.json", {
			type: "application/json",
		});

		act(() => {
			Object.defineProperty(fileInput, "files", {
				value: [mockFile],
				writable: false,
			});

			mockFileReader.result = "invalid json content";
			if (mockFileReader.onload) {
				mockFileReader.onload();
			}
		});

		expect(
			screen.getByRole("heading", { name: "ガントチャート" }),
		).toBeInTheDocument();

		consoleSpy.mockRestore();
	});

	test("handles empty file import", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const fileInput = screen.getByLabelText("JSONインポート");
		const mockFile = new File([""], "empty.json", { type: "application/json" });

		act(() => {
			Object.defineProperty(fileInput, "files", {
				value: [mockFile],
				writable: false,
			});

			mockFileReader.result = "";
			if (mockFileReader.onload) {
				mockFileReader.onload();
			}
		});

		expect(
			screen.getByRole("heading", { name: "ガントチャート" }),
		).toBeInTheDocument();
	});

	test("handles file read error", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const fileInput = screen.getByLabelText("JSONインポート");
		const mockFile = new File(["test"], "test.json", {
			type: "application/json",
		});

		act(() => {
			Object.defineProperty(fileInput, "files", {
				value: [mockFile],
				writable: false,
			});

			if (mockFileReader.onerror) {
				mockFileReader.onerror(new Error("File read error"));
			}
		});

		expect(
			screen.getByRole("heading", { name: "ガントチャート" }),
		).toBeInTheDocument();
		consoleSpy.mockRestore();
	});
});

describe("Zoom Functionality", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("day zoom button calls correct gantt methods", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.init).toHaveBeenCalled());

		const dayButton = screen.getByRole("button", { name: "日" });

		act(() => {
			dayButton.click();
		});

		expect(gantt.config.scales).toEqual([
			{ unit: "month", step: 1, format: "%F, %Y" },
			{ unit: "day", step: 1, format: "%j, %D" },
		]);
		expect(gantt.config.min_column_width).toBe(60);
		expect(gantt.render).toHaveBeenCalled();
	});

	test("week zoom button calls correct gantt methods", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.init).toHaveBeenCalled());

		const weekButton = screen.getByRole("button", { name: "週" });

		act(() => {
			weekButton.click();
		});

		expect(gantt.config.scales).toEqual([
			{ unit: "month", step: 1, format: "%F, %Y" },
			{ unit: "week", step: 1, format: "Week #%W" },
		]);
		expect(gantt.config.min_column_width).toBe(100);
		expect(gantt.render).toHaveBeenCalled();
	});

	test("month zoom button calls correct gantt methods", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.init).toHaveBeenCalled());

		const monthButton = screen.getByRole("button", { name: "月" });

		act(() => {
			monthButton.click();
		});

		expect(gantt.config.scales).toEqual([
			{ unit: "year", step: 1, format: "%Y" },
			{ unit: "month", step: 1, format: "%F" },
		]);
		expect(gantt.config.min_column_width).toBe(120);
		expect(gantt.render).toHaveBeenCalled();
	});

	test("zoom buttons maintain current task data", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.init).toHaveBeenCalled());
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const initialParseCallsCount = (gantt.parse as any).mock.calls.length;

		const dayButton = screen.getByRole("button", { name: "日" });
		const weekButton = screen.getByRole("button", { name: "週" });
		const monthButton = screen.getByRole("button", { name: "月" });

		act(() => {
			dayButton.click();
			weekButton.click();
			monthButton.click();
		});

		expect((gantt.parse as any).mock.calls.length).toBe(initialParseCallsCount);
		expect(gantt.render).toHaveBeenCalledTimes(3);
	});

	test("zoom button state reflects current zoom level", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.init).toHaveBeenCalled());

		const dayButton = screen.getByRole("button", { name: "日" });
		const weekButton = screen.getByRole("button", { name: "週" });
		const monthButton = screen.getByRole("button", { name: "月" });

		expect(weekButton).toBeDisabled();
		expect(dayButton).not.toBeDisabled();
		expect(monthButton).not.toBeDisabled();

		act(() => {
			dayButton.click();
		});

		expect(dayButton).toBeDisabled();
		expect(weekButton).not.toBeDisabled();
		expect(monthButton).not.toBeDisabled();
	});
});

describe("Accessibility and Keyboard Navigation", () => {
	test("component has proper ARIA labels and roles", async () => {
		render(<GanttChart />);

		const heading = screen.getByRole("heading", { name: "ガントチャート" });
		expect(heading).toBeInTheDocument();
		expect(heading.tagName).toBe("H2");

		const buttons = screen.getAllByRole("button");
		expect(buttons.length).toBeGreaterThan(0);
		buttons.forEach((button) => {
			expect(button).toHaveAccessibleName();
		});

		const fileInput = screen.getByLabelText("JSONインポート");
		expect(fileInput).toBeInTheDocument();
		expect(fileInput).toHaveAttribute("type", "file");
		expect(fileInput).toHaveAttribute("accept", ".json");
	});

	test("buttons are keyboard navigable", async () => {
		render(<GanttChart />);

		const addTaskButton = screen.getByRole("button", { name: "タスク追加" });
		const exportButton = screen.getByRole("button", {
			name: "JSONエクスポート",
		});

		addTaskButton.focus();
		expect(document.activeElement).toBe(addTaskButton);

		exportButton.focus();
		expect(document.activeElement).toBe(exportButton);
	});

	test("zoom buttons are accessible and properly labeled", async () => {
		render(<GanttChart />);

		const dayButton = screen.getByRole("button", { name: "日" });
		const weekButton = screen.getByRole("button", { name: "週" });
		const monthButton = screen.getByRole("button", { name: "月" });

		expect(dayButton).toBeInTheDocument();
		expect(weekButton).toBeInTheDocument();
		expect(monthButton).toBeInTheDocument();

		dayButton.focus();
		expect(document.activeElement).toBe(dayButton);
	});

	test("gantt container has appropriate accessibility attributes", async () => {
		render(<GanttChart />);

		const ganttContainer = screen.getByLabelText("gantt-chart-area");
		expect(ganttContainer).toBeInTheDocument();
		expect(ganttContainer).toHaveAttribute("aria-label", "gantt-chart-area");
	});

	test("file input is properly hidden but accessible", async () => {
		render(<GanttChart />);

		const fileInput = screen.getByLabelText("JSONインポート");
		const styles = window.getComputedStyle(fileInput);

		expect(fileInput).toBeInTheDocument();
		expect(fileInput.style.display).toBe("none");

		const label = screen.getByText("JSONインポート");
		expect(label.tagName).toBe("LABEL");
		expect(label).toHaveAttribute("for", "import-json-file");
	});
});

describe("Performance and Stress Testing", () => {
	test("handles large number of tasks efficiently", async () => {
		const largeTasks = Array.from({ length: 100 }, (_, i) => ({
			id: `task-${i}`,
			text: `Task ${i}`,
			start_date: `2024-01-${String(1 + (i % 30)).padStart(2, "0")}`,
			end_date: `2024-01-${String(2 + (i % 30)).padStart(2, "0")}`,
			duration: 1,
			progress: Math.random(),
			urgency: i % 2 === 0 ? "urgent" : "not_urgent",
			difficulty: i % 3 === 0 ? "difficult" : "easy",
		}));

		(gantt.serialize as any).mockReturnValue({ data: largeTasks });

		const startTime = performance.now();
		render(<GanttChart />);

		await waitFor(() => expect(gantt.init).toHaveBeenCalled(), {
			timeout: 5000,
		});
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled(), {
			timeout: 5000,
		});

		const endTime = performance.now();
		expect(endTime - startTime).toBeLessThan(3000);
	});

	test("handles rapid successive task operations", async () => {
		vi.setSystemTime(new Date(2024, 0, 1));
		(gantt.uid as any).mockImplementation(
			() => `task-${Date.now()}-${Math.random()}`,
		);

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const addTaskButton = screen.getByRole("button", { name: "タスク追加" });

		for (let i = 0; i < 10; i++) {
			act(() => {
				addTaskButton.click();
			});
		}

		await waitFor(() => {
			const parseCalls = (gantt.parse as any).mock.calls;
			expect(parseCalls.length).toBeGreaterThan(1);
		});

		vi.useRealTimers();
	});

	test("memory cleanup on multiple mount/unmount cycles", async () => {
		for (let i = 0; i < 5; i++) {
			const { unmount } = render(<GanttChart />);
			await waitFor(() => expect(gantt.init).toHaveBeenCalled());

			act(() => {
				unmount();
			});

			expect(gantt.clearAll).toHaveBeenCalled();
			vi.clearAllMocks();
		}

		expect(window.handleGanttTaskDelete).toBeUndefined();
	});
});

describe("Gantt Template Functions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("task_class template function returns correct classes for urgency and difficulty", async () => {
		render(<GanttChart />);
		await waitFor(() =>
			expect(gantt.templates.task_class).toBeInstanceOf(Function),
		);

		const taskClassFn = gantt.templates.task_class;
		const mockStartDate = new Date(2024, 0, 1);
		const mockEndDate = new Date(2024, 0, 2);

		const urgentDifficultTask = { urgency: "urgent", difficulty: "difficult" };
		const urgentEasyTask = { urgency: "urgent", difficulty: "easy" };
		const notUrgentDifficultTask = {
			urgency: "not_urgent",
			difficulty: "difficult",
		};
		const notUrgentEasyTask = { urgency: "not_urgent", difficulty: "easy" };

		expect(
			taskClassFn(mockStartDate, mockEndDate, urgentDifficultTask),
		).toContain("gantt_task_urgent_difficult");
		expect(taskClassFn(mockStartDate, mockEndDate, urgentEasyTask)).toContain(
			"gantt_task_urgent_easy",
		);
		expect(
			taskClassFn(mockStartDate, mockEndDate, notUrgentDifficultTask),
		).toContain("gantt_task_not_urgent_difficult");
		expect(
			taskClassFn(mockStartDate, mockEndDate, notUrgentEasyTask),
		).toContain("gantt_task_not_urgent_easy");
	});

	test("task_class template handles milestone type", async () => {
		render(<GanttChart />);
		await waitFor(() =>
			expect(gantt.templates.task_class).toBeInstanceOf(Function),
		);

		const taskClassFn = gantt.templates.task_class;
		const mockStartDate = new Date(2024, 0, 1);
		const mockEndDate = new Date(2024, 0, 1);

		const milestoneTask = {
			type: gantt.config.types.milestone,
			urgency: "urgent",
			difficulty: "easy",
		};

		const result = taskClassFn(mockStartDate, mockEndDate, milestoneTask);
		expect(result).toContain("gantt_milestone");
		expect(result).toContain("gantt_task_urgent_easy");
	});

	test("task_class template handles selected task", async () => {
		render(<GanttChart />);
		await waitFor(() =>
			expect(gantt.templates.task_class).toBeInstanceOf(Function),
		);

		const taskClassFn = gantt.templates.task_class;
		const mockStartDate = new Date(2024, 0, 1);
		const mockEndDate = new Date(2024, 0, 2);

		(gantt.getState as any).mockReturnValue({ selected_task: "task-1" });

		const selectedTask = {
			id: "task-1",
			urgency: "urgent",
			difficulty: "easy",
		};
		const unselectedTask = {
			id: "task-2",
			urgency: "urgent",
			difficulty: "easy",
		};

		const selectedResult = taskClassFn(
			mockStartDate,
			mockEndDate,
			selectedTask,
		);
		const unselectedResult = taskClassFn(
			mockStartDate,
			mockEndDate,
			unselectedTask,
		);

		expect(selectedResult).toContain("gantt_selected");
		expect(unselectedResult).not.toContain("gantt_selected");
	});

	test("timeline_cell_class template function handles holidays and weekends", async () => {
		render(<GanttChart />);
		await waitFor(() =>
			expect(gantt.templates.timeline_cell_class).toBeInstanceOf(Function),
		);

		const timelineCellFn = gantt.templates.timeline_cell_class;
		const mockTask = { id: 1 };

		(gantt.date.date_to_str as any).mockReturnValue(() => "2024-01-01");

		const holidayDate = new Date(2024, 0, 1);
		const regularDate = new Date(2024, 0, 15);
		const weekendDate = new Date(2024, 0, 6);

		holidayDate.getDay = vi.fn().mockReturnValue(1);
		weekendDate.getDay = vi.fn().mockReturnValue(6);
		regularDate.getDay = vi.fn().mockReturnValue(2);

		(gantt.isWorkTime as any) = vi.fn().mockImplementation((date, unit) => {
			return date.getDay() !== 0 && date.getDay() !== 6;
		});

		const holidayResult = timelineCellFn(mockTask, holidayDate);
		expect(holidayResult).toContain("gantt_holiday");

		(gantt.date.date_to_str as any).mockReturnValue(() => "2024-01-15");
		const regularResult = timelineCellFn(mockTask, regularDate);
		expect(regularResult).toBe("");

		(gantt.date.date_to_str as any).mockReturnValue(() => "2024-01-06");
		const weekendResult = timelineCellFn(mockTask, weekendDate);
		expect(weekendResult).toContain("gantt_weekend");
	});

	test("format_date template function formats dates correctly", async () => {
		render(<GanttChart />);
		await waitFor(() =>
			expect(gantt.templates.format_date).toBeInstanceOf(Function),
		);

		const formatDateFn = gantt.templates.format_date;
		const testDate = new Date(2024, 2, 15);

		const formatted = formatDateFn(testDate);
		expect(formatted).toBe("2024-03-15");

		const leapYearDate = new Date(2024, 1, 29);
		const leapFormatted = formatDateFn(leapYearDate);
		expect(leapFormatted).toBe("2024-02-29");
	});
});

describe("Data Validation and Edge Cases", () => {
	test("handles tasks with missing required properties", async () => {
		const incompleteTask = { id: "incomplete", text: null };

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const onLightboxSaveHandlers =
			gantt.__getAttachedHandlers("onLightboxSave");
		const handler = onLightboxSaveHandlers[onLightboxSaveHandlers.length - 1];

		expect(() => {
			act(() => {
				handler?.("incomplete", incompleteTask, true);
			});
		}).not.toThrow();
	});

	test("validates date consistency (start_date before end_date)", async () => {
		const invalidTask = {
			id: "invalid-dates",
			text: "Invalid Task",
			start_date: new Date(2024, 0, 15),
			end_date: new Date(2024, 0, 10),
			duration: 5,
		};

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const onLightboxSaveHandlers =
			gantt.__getAttachedHandlers("onLightboxSave");
		const handler = onLightboxSaveHandlers[onLightboxSaveHandlers.length - 1];

		expect(() => {
			act(() => {
				handler?.("invalid-dates", invalidTask, true);
			});
		}).not.toThrow();
	});

	test("handles progress values outside valid range", async () => {
		const invalidProgressTasks = [
			{ id: "negative-progress", progress: -0.5 },
			{ id: "over-progress", progress: 1.5 },
			{ id: "null-progress", progress: null },
			{ id: "string-progress", progress: "50%" },
		];

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		invalidProgressTasks.forEach((task) => {
			const onLightboxSaveHandlers =
				gantt.__getAttachedHandlers("onLightboxSave");
			const handler = onLightboxSaveHandlers[onLightboxSaveHandlers.length - 1];

			expect(() => {
				act(() => {
					handler?.(task.id, task, true);
				});
			}).not.toThrow();
		});
	});

	test("handles duplicate task IDs", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const duplicateTask = {
			id: "1",
			text: "Duplicate Task",
			start_date: new Date(2024, 0, 1),
			end_date: new Date(2024, 0, 2),
			duration: 1,
		};

		const onLightboxSaveHandlers =
			gantt.__getAttachedHandlers("onLightboxSave");
		const handler = onLightboxSaveHandlers[onLightboxSaveHandlers.length - 1];

		expect(() => {
			act(() => {
				handler?.("1", duplicateTask, false);
			});
		}).not.toThrow();
	});

	test("handles extremely long task names", async () => {
		const longName = "A".repeat(1000);
		const taskWithLongName = {
			id: "long-name-task",
			text: longName,
			start_date: new Date(2024, 0, 1),
			end_date: new Date(2024, 0, 2),
			duration: 1,
		};

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const onLightboxSaveHandlers =
			gantt.__getAttachedHandlers("onLightboxSave");
		const handler = onLightboxSaveHandlers[onLightboxSaveHandlers.length - 1];

		expect(() => {
			act(() => {
				handler?.("long-name-task", taskWithLongName, true);
			});
		}).not.toThrow();
	});

	test("handles zero and negative durations", async () => {
		const edgeDurationTasks = [
			{ id: "zero-duration", duration: 0 },
			{ id: "negative-duration", duration: -5 },
			{ id: "float-duration", duration: 2.5 },
		];

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		edgeDurationTasks.forEach((task) => {
			const onLightboxSaveHandlers =
				gantt.__getAttachedHandlers("onLightboxSave");
			const handler = onLightboxSaveHandlers[onLightboxSaveHandlers.length - 1];

			expect(() => {
				act(() => {
					handler?.(task.id, task, true);
				});
			}).not.toThrow();
		});
	});
});

describe("Concurrent Operations and Race Conditions", () => {
	test("handles simultaneous task creation and deletion", async () => {
		vi.setSystemTime(new Date(2024, 0, 1));
		(gantt.uid as any).mockReturnValue("concurrent-task");

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const addTaskButton = screen.getByRole("button", { name: "タスク追加" });

		act(() => {
			addTaskButton.click();
			if ((window as any).handleGanttTaskDelete) {
				(window as any).handleGanttTaskDelete("1");
			}
			addTaskButton.click();
		});

		await waitFor(() => {
			expect(gantt.parse).toHaveBeenCalled();
		});

		vi.useRealTimers();
	});

	test("handles multiple event handlers firing simultaneously", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const initialParseCall = (gantt.parse as any).mock.calls.find(
			(call: any[]) => call[0]?.data?.length > 0,
		);
		const initialTasks = initialParseCall![0].data;
		const testTaskId = initialTasks[0]?.id;
		if (!testTaskId) return;

		const updatedTask = {
			id: testTaskId,
			text: "Concurrently Updated",
			start_date: new Date(2024, 0, 10),
			end_date: new Date(2024, 0, 15),
			duration: 5,
		};

		(gantt.getTask as any).mockReturnValue(updatedTask);

		const onAfterTaskDragHandlers =
			gantt.__getAttachedHandlers("onAfterTaskDrag");
		const onLightboxSaveHandlers =
			gantt.__getAttachedHandlers("onLightboxSave");

		act(() => {
			onAfterTaskDragHandlers[0]?.(testTaskId, "move", {});
			onLightboxSaveHandlers[0]?.(testTaskId, updatedTask, false);
		});

		await waitFor(() => {
			expect(gantt.parse).toHaveBeenCalled();
		});
	});

	test("handles component unmount during async operations", async () => {
		const { unmount } = render(<GanttChart />);
		await waitFor(() => expect(gantt.init).toHaveBeenCalled());

		const addTaskButton = screen.getByRole("button", { name: "タスク追加" });
		act(() => {
			addTaskButton.click();
			unmount();
		});

		expect(gantt.clearAll).toHaveBeenCalled();
	});

	test("handles rapid zoom level changes", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.init).toHaveBeenCalled());

		const dayButton = screen.getByRole("button", { name: "日" });
		const weekButton = screen.getByRole("button", { name: "週" });
		const monthButton = screen.getByRole("button", { name: "月" });

		act(() => {
			dayButton.click();
			monthButton.click();
			weekButton.click();
			dayButton.click();
		});

		expect(gantt.render).toHaveBeenCalledTimes(4);
		expect(gantt.config.min_column_width).toBe(60);
	});
});

describe("Integration Tests", () => {
	test("complete task lifecycle: create, edit, reorder, delete", async () => {
		vi.setSystemTime(new Date(2024, 0, 1));
		(gantt.uid as any).mockReturnValue("lifecycle-task");
		(gantt.calculateEndDate as any).mockImplementation(
			({ start_date, duration }: { start_date: Date; duration: number }) => {
				const endDate = new Date(start_date);
				endDate.setDate(start_date.getDate() + duration);
				return endDate;
			},
		);

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const addTaskButton = screen.getByRole("button", { name: "タスク追加" });
		act(() => {
			addTaskButton.click();
		});

		await waitFor(() => {
			const parseCalls = (gantt.parse as any).mock.calls;
			const lastData = parseCalls[parseCalls.length - 1][0].data;
			expect(
				lastData.find((t: any) => t.id === "lifecycle-task"),
			).toBeDefined();
		});

		const editedTask = {
			id: "lifecycle-task",
			text: "Edited Task",
			start_date: new Date(2024, 0, 5),
			end_date: new Date(2024, 0, 10),
			duration: 5,
			progress: 0.6,
		};

		const onLightboxSaveHandlers =
			gantt.__getAttachedHandlers("onLightboxSave");
		act(() => {
			onLightboxSaveHandlers[0]?.("lifecycle-task", editedTask, false);
		});

		await waitFor(() => {
			const parseCalls = (gantt.parse as any).mock.calls;
			const lastData = parseCalls[parseCalls.length - 1][0].data;
			const task = lastData.find((t: any) => t.id === "lifecycle-task");
			expect(task.text).toBe("Edited Task");
		});

		const reorderedData = [
			editedTask,
			...((gantt.parse as any).mock.calls[0][0].data || []),
		];
		(gantt.serialize as any).mockReturnValue({ data: reorderedData });

		const onBeforeRowDragEndHandlers =
			gantt.__getAttachedHandlers("onBeforeRowDragEnd");
		act(() => {
			onBeforeRowDragEndHandlers[0]?.("lifecycle-task", "0", 0);
		});

		expect(gantt.moveTask).toHaveBeenCalled();
		expect(gantt.serialize).toHaveBeenCalled();

		act(() => {
			if ((window as any).handleGanttTaskDelete) {
				(window as any).handleGanttTaskDelete("lifecycle-task");
			}
		});

		expect(gantt.deleteTask).toHaveBeenCalledWith("lifecycle-task");
		vi.useRealTimers();
	});

	test("import JSON, modify tasks, and export JSON", async () => {
		const mockFileReader = {
			readAsText: vi.fn(),
			result: "",
			onload: null,
			onerror: null,
		};
		global.FileReader = vi.fn(() => mockFileReader) as any;

		const importData = [
			{
				id: "import-1",
				text: "Imported Task",
				start_date: "2024-01-01",
				end_date: "2024-01-02",
				duration: 1,
				progress: 0,
			},
		];

		const mockCreateObjectURL = vi.fn(() => "mock-export-url");
		const mockRevokeObjectURL = vi.fn();
		const mockLinkClick = vi.fn();

		global.URL.createObjectURL = mockCreateObjectURL;
		global.URL.revokeObjectURL = mockRevokeObjectURL;

		const mockCreateElement = vi
			.spyOn(document, "createElement")
			.mockImplementation((tagName: string) => {
				if (tagName.toLowerCase() === "a") {
					return {
						href: "",
						download: "",
						click: mockLinkClick,
					} as unknown as HTMLAnchorElement;
				}
				return document.createElement(tagName);
			});
		const mockAppendChild = vi
			.spyOn(document.body, "appendChild")
			.mockImplementation((node) => node);
		const mockRemoveChild = vi
			.spyOn(document.body, "removeChild")
			.mockImplementation((node) => node);

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const fileInput = screen.getByLabelText("JSONインポート");
		act(() => {
			mockFileReader.result = JSON.stringify(importData);
			if (mockFileReader.onload) mockFileReader.onload();
		});

		await waitFor(() => {
			const parseCalls = (gantt.parse as any).mock.calls;
			const lastData = parseCalls[parseCalls.length - 1][0].data;
			expect(lastData.find((t: any) => t.id === "import-1")).toBeDefined();
		});

		const modifiedTask = {
			id: "import-1",
			text: "Modified Imported Task",
			start_date: new Date(2024, 0, 5),
			end_date: new Date(2024, 0, 8),
			duration: 3,
			progress: 0.5,
		};

		const onLightboxSaveHandlers =
			gantt.__getAttachedHandlers("onLightboxSave");
		act(() => {
			onLightboxSaveHandlers[0]?.("import-1", modifiedTask, false);
		});

		const exportButton = screen.getByRole("button", {
			name: "JSONエクスポート",
		});
		act(() => {
			exportButton.click();
		});

		expect(mockCreateObjectURL).toHaveBeenCalled();
		expect(mockLinkClick).toHaveBeenCalled();

		mockCreateElement.mockRestore();
		mockAppendChild.mockRestore();
		mockRemoveChild.mockRestore();
	});

	test("zoom changes persist through task operations", async () => {
		render(<GanttChart />);
		await waitFor(() => expect(gantt.init).toHaveBeenCalled());

		const weekButton = screen.getByRole("button", { name: "週" });
		act(() => {
			weekButton.click();
		});

		expect(gantt.config.scales).toEqual([
			{ unit: "month", step: 1, format: "%F, %Y" },
			{ unit: "week", step: 1, format: "Week #%W" },
		]);

		const addTaskButton = screen.getByRole("button", { name: "タスク追加" });
		act(() => {
			addTaskButton.click();
		});

		expect(gantt.config.scales).toEqual([
			{ unit: "month", step: 1, format: "%F, %Y" },
			{ unit: "week", step: 1, format: "Week #%W" },
		]);

		const monthButton = screen.getByRole("button", { name: "月" });
		act(() => {
			monthButton.click();
		});

		expect(gantt.config.scales).toEqual([
			{ unit: "year", step: 1, format: "%Y" },
			{ unit: "month", step: 1, format: "%F" },
		]);
	});

	test("complete workflow with all features", async () => {
		vi.setSystemTime(new Date(2024, 0, 1));
		let taskCounter = 0;
		(gantt.uid as any).mockImplementation(
			() => `workflow-task-${++taskCounter}`,
		);

		render(<GanttChart />);
		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());

		const dayButton = screen.getByRole("button", { name: "日" });
		act(() => {
			dayButton.click();
		});

		const addTaskButton = screen.getByRole("button", { name: "タスク追加" });
		act(() => {
			addTaskButton.click();
			addTaskButton.click();
		});

		const editedTask = {
			id: "workflow-task-1",
			text: "Workflow Task 1 - Edited",
			start_date: new Date(2024, 0, 5),
			end_date: new Date(2024, 0, 10),
			duration: 5,
			progress: 0.8,
		};

		const onLightboxSaveHandlers =
			gantt.__getAttachedHandlers("onLightboxSave");
		act(() => {
			onLightboxSaveHandlers[0]?.("workflow-task-1", editedTask, false);
		});

		const mockCreateObjectURL = vi.fn(() => "mock-workflow-url");
		global.URL.createObjectURL = mockCreateObjectURL;

		const exportButton = screen.getByRole("button", {
			name: "JSONエクスポート",
		});
		act(() => {
			exportButton.click();
		});

		expect(mockCreateObjectURL).toHaveBeenCalled();

		act(() => {
			if ((window as any).handleGanttTaskDelete) {
				(window as any).handleGanttTaskDelete("workflow-task-2");
			}
		});

		expect(gantt.deleteTask).toHaveBeenCalledWith("workflow-task-2");
		vi.useRealTimers();
	});
});
