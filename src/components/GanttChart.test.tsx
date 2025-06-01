import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom"; // For extended DOM matchers
import { vi } from 'vitest'; // Import vi for mocking

// Explicitly mock 'dhtmlx-gantt' with a factory that returns the mock structure
vi.mock('dhtmlx-gantt', () => {
  const actualMock = vi.importActual<typeof import('@/__mocks__/dhtmlx-gantt')>('@/__mocks__/dhtmlx-gantt');
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
	if (gantt.__clearAttachedHandlers) { // Check if the method exists on the mock
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
			screen.getByRole('heading', { name: "ガントチャート" }),
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
			const parseCall = (gantt.parse as vi.Mock).mock.calls[0][0];
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
        const initialParseCall = (gantt.parse as vi.Mock).mock.calls.find(call => call[0]?.data?.length > 0);
        if (!initialParseCall) {
            throw new Error("Initial gantt.parse call with data not found for onAfterTaskDrag test.");
        }
        const initialTasks = initialParseCall[0].data;
		const testTaskId = initialTasks[0]?.id;
		if (!testTaskId) {
			throw new Error("Initial tasks not found or task ID missing for onAfterTaskDrag test.");
		}

		const updatedTaskDataFromGantt = { // Data as gantt.getTask would return it
			id: testTaskId,
			text: "Updated Text by Drag",
			start_date: new Date(2024, 0, 15),
			end_date: new Date(2024, 0, 25),
			duration: 10,
		};
		(gantt.getTask as vi.Mock).mockReturnValue(updatedTaskDataFromGantt);
        // Mock format_date to return easily verifiable strings
        (gantt.templates.format_date as vi.Mock).mockImplementation((date: Date) => {
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        });


		const onAfterTaskDragHandlers = gantt.__getAttachedHandlers("onAfterTaskDrag");
		const onAfterTaskDragHandler = onAfterTaskDragHandlers[onAfterTaskDragHandlers.length - 1];

		act(() => {
			onAfterTaskDragHandler?.(testTaskId, "move", {});
		});

        await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
        const parseCalls = (gantt.parse as vi.Mock).mock.calls;
        const lastParseData = parseCalls[parseCalls.length - 1][0].data;
        const updatedTaskInParse = lastParseData.find((t:any) => t.id === testTaskId);

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
        const initialParseCall = (gantt.parse as vi.Mock).mock.calls.find(call => call[0]?.data?.length > 0);
        if (!initialParseCall) {
            throw new Error("Initial gantt.parse call with data not found for onLightboxSave test.");
        }
        const initialTasks = initialParseCall[0].data;
		const testTaskId = initialTasks[0]?.id;
		if (!testTaskId) {
			throw new Error("Initial tasks not found or task ID missing for onLightboxSave test.");
		}

		const savedTaskData = { // Data as it would come from the lightbox
			id: testTaskId,
			text: "Saved Task",
			start_date: new Date(2024, 1, 1), // Feb 1, 2024
			end_date: new Date(2024, 1, 10), // Feb 10, 2024
			duration: 9,
			progress: 0.5,
			type: "task", // Ensure type is included as component might use it
		};
        (gantt.templates.format_date as vi.Mock).mockImplementation((date: Date) => {
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        });

		const onLightboxSaveHandlers = gantt.__getAttachedHandlers("onLightboxSave");
		const onLightboxSaveHandler = onLightboxSaveHandlers[onLightboxSaveHandlers.length - 1];

		act(() => {
			onLightboxSaveHandler?.(testTaskId, savedTaskData, false); // isNew = false
		});

		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
        const parseCalls = (gantt.parse as vi.Mock).mock.calls;
        const lastParseData = parseCalls[parseCalls.length - 1][0].data;
        const updatedTaskInParse = lastParseData.find((t:any) => t.id === testTaskId);


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
		(gantt.confirm as vi.Mock).mockImplementation((config) => {
			if (config.callback) config.callback(true); // Auto-confirm "yes"
		});
		(gantt.isTaskExists as vi.Mock).mockReturnValue(true);
		(gantt.deleteTask as vi.Mock).mockClear();
		(gantt.uid as vi.Mock).mockClear();
		(gantt.calculateEndDate as vi.Mock).mockClear();
        (gantt.getTask as vi.Mock).mockImplementation((id) => ({ id, text: `Task ${id}`})); // Default mock for getTask
	});

	test("handleDeleteTask results in gantt.deleteTask and updated data in gantt.parse", async () => {
		// GanttChart renders and initializes tasks.
        // The initial tasks are from transformTasksForDhtmlx(initialDataFromPrevLib)
        // Let's assume initialDataFromPrevLib has an ID that we can target.
        const taskToDeleteId = 1; // from initialDataFromPrevLib

        (gantt.confirm as vi.Mock).mockImplementation((config) => {
			if (config.callback) config.callback(true); // Auto-confirm "yes"
		});
		(gantt.isTaskExists as vi.Mock).mockReturnValue(true);
        (gantt.getTask as vi.Mock).mockReturnValue({ id: taskToDeleteId, text: "Task 1" }); // Mock for confirm message
        (gantt.parse as vi.Mock).mockClear(); // Clear initial parse calls

		render(<GanttChart />);

        // Ensure initial parse has happened from useEffect
        await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
        const initialParseCallArgs = (gantt.parse as vi.Mock).mock.calls[0][0];
        expect(initialParseCallArgs.data.find((t: any) => t.id === taskToDeleteId)).toBeDefined();
        (gantt.parse as vi.Mock).mockClear(); // Clear for the next assertion


		act(() => {
			if ((window as any).handleGanttTaskDelete) {
				(window as any).handleGanttTaskDelete(taskToDeleteId);
			} else {
				throw new Error("handleGanttTaskDelete was not exposed on window by GanttChart component");
			}
		});

		expect(gantt.confirm).toHaveBeenCalled();
		expect(gantt.isTaskExists).toHaveBeenCalledWith(taskToDeleteId);
		expect(gantt.deleteTask).toHaveBeenCalledWith(taskToDeleteId);

        // Check that gantt.parse is called with data excluding the deleted task
        await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
        const parseCalls = (gantt.parse as vi.Mock).mock.calls;
        const lastParseData = parseCalls[parseCalls.length - 1][0].data;
        expect(lastParseData.find((t: any) => t.id === taskToDeleteId)).toBeUndefined();
	});

	test("deleted tasks do not reappear after adding a new task", async () => {
		render(<GanttChart />);
        await waitFor(() => expect(gantt.parse).toHaveBeenCalled()); // Initial parse
        // Find the first parse call that actually has data.
        const firstMeaningfulParseCall = (gantt.parse as vi.Mock).mock.calls.find(call => call[0]?.data?.length > 0);
        if (!firstMeaningfulParseCall) {
            throw new Error("Initial gantt.parse call with data not found for Task Deletion test.");
        }
        const initialTasks = firstMeaningfulParseCall[0].data;
        const taskToDeleteId = initialTasks[0]?.id;
        const taskToKeepId = initialTasks.length > 1 ? initialTasks[1]?.id : null; // Handle if only one task

        if (!taskToDeleteId) { // taskToKeepId can be null if only one task initially
            throw new Error("Not enough initial tasks for this test (need at least one).");
        }
        (gantt.parse as vi.Mock).mockClear();

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
        let parseCallsAfterDelete = (gantt.parse as vi.Mock).mock.calls;
        let currentParsedTasks = parseCallsAfterDelete[parseCallsAfterDelete.length - 1][0].data;
        expect(currentParsedTasks.find((t:any) => t.id === taskToDeleteId)).toBeUndefined();
        (gantt.parse as vi.Mock).mockClear();


		// 2. Add a new task
		vi.setSystemTime(new Date(2024, 3, 15)); // April 15, 2024
		(gantt.uid as vi.Mock).mockReturnValue("newTask999");
		(gantt.date.str_to_date as vi.Mock).mockImplementation((dateStr) => new Date(dateStr));
		(gantt.calculateEndDate as vi.Mock).mockImplementation(({ start_date, duration }) => {
			const endDate = new Date(start_date);
			endDate.setDate(start_date.getDate() + duration);
			return endDate;
		});

		const addTaskButton = screen.getByRole("button", { name: "タスク追加" }); // Changed to Japanese
		act(() => {
			addTaskButton.click();
		});

		await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
        let parseCallsAfterAdd = (gantt.parse as vi.Mock).mock.calls;
        currentParsedTasks = parseCallsAfterAdd[parseCallsAfterAdd.length - 1][0].data;


		expect(currentParsedTasks.find((t: any) => t.id === taskToDeleteId)).toBeUndefined();
		expect(currentParsedTasks.find((t: any) => t.id === "newTask999")).toBeDefined();
		if (taskToKeepId) { // Only check for taskToKeepId if it existed
		    expect(currentParsedTasks.find((t: any) => t.id === taskToKeepId)).toBeDefined();
		}

		vi.useRealTimers();
	});
});

describe("Task Reordering", () => {
	beforeEach(() => {
		(gantt.moveTask as vi.Mock).mockClear();
		(gantt.serialize as vi.Mock).mockClear();
	});

	test("onBeforeRowDragEnd calls relevant gantt methods and updates data via gantt.parse", async () => {
		// Component's initial tasks are from transformTasksForDhtmlx(initialDataFromPrevLib)
        // Task IDs 1 and 2 exist in this initial data.
		const reorderedGanttTasksFromSerialize = [
			{ id: 2, text: "Task 2 Reordered", start_date: new Date(2024,0,2), end_date: new Date(2024,0,3), duration: 1, parent: "0", progress: 0, type: "task", open: true, urgency: "urgent", difficulty: "easy" }, // Add custom props here
			{ id: 1, text: "Task 1 Reordered", start_date: new Date(2024,0,1), end_date: new Date(2024,0,2), duration: 1, parent: "0", progress: 0, type: "task", open: true, urgency: "urgent", difficulty: "difficult" },
		];
		(gantt.serialize as vi.Mock).mockReturnValue({ data: reorderedGanttTasksFromSerialize });
        (gantt.parse as vi.Mock).mockClear();

		render(<GanttChart />);
        await waitFor(() => expect(gantt.parse).toHaveBeenCalled()); // Wait for initial render's parse
        (gantt.parse as vi.Mock).mockClear();

		const onBeforeRowDragEndHandlers = gantt.__getAttachedHandlers("onBeforeRowDragEnd");
		const onBeforeRowDragEndHandler = onBeforeRowDragEndHandlers[onBeforeRowDragEndHandlers.length - 1];

		const draggedTaskId = 2; // Task ID from initialDataFromPrevLib (Task 2)
		const targetParentId = "0";
		const targetIndex = 0; // Move Task 2 to the first position (before Task 1)

		act(() => {
			onBeforeRowDragEndHandler?.(draggedTaskId, targetParentId, targetIndex);
		});

		expect(gantt.moveTask).toHaveBeenCalledWith(draggedTaskId, targetIndex, targetParentId);
		expect(gantt.serialize).toHaveBeenCalled();

        await waitFor(() => expect(gantt.parse).toHaveBeenCalled());
        const parseCalls = (gantt.parse as vi.Mock).mock.calls;
        const lastParseData = parseCalls[parseCalls.length - 1][0].data;

        expect(lastParseData.length).toBe(reorderedGanttTasksFromSerialize.length);
		expect(lastParseData[0].text).toBe("Task 2 Reordered"); // Serialized data is used
		expect(lastParseData[1].text).toBe("Task 1 Reordered");

        // Check preservation of custom properties.
        // The component's logic merges existingTask props with serialized props.
        // Initial task 1: urgency "urgent", difficulty "difficult"
        // Initial task 2: urgency "urgent", difficulty "easy"
        // These should be preserved.
        const task1AfterReorder = lastParseData.find((t:any) => t.id === 1);
        const task2AfterReorder = lastParseData.find((t:any) => t.id === 2);

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
		(gantt.uid as vi.Mock).mockClear();
		(gantt.date.str_to_date as vi.Mock).mockClear();
		(gantt.calculateEndDate as vi.Mock).mockClear();
        (gantt.parse as vi.Mock).mockClear();

        // Ensure a clean body for each test in this suite, especially before render
        document.body.innerHTML = '';
        document.head.innerHTML = ''; // Also clear head just in case
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
		(gantt.uid as vi.Mock).mockReturnValue("test-uid-123");
		(gantt.calculateEndDate as vi.Mock).mockImplementation(({ start_date, duration }) => {
			const endDate = new Date(start_date);
			endDate.setDate(start_date.getDate() + duration);
			return endDate;
		});
        (gantt.parse as vi.Mock).mockClear();

		render(<GanttChart />);

        await waitFor(() => expect(gantt.parse).toHaveBeenCalled()); // Wait for initial parse
        (gantt.parse as vi.Mock).mockClear(); // Clear for the specific assertion

		const addTaskButton = screen.getByRole("button", { name: "タスク追加" });
		act(() => {
			addTaskButton.click();
		});

		await waitFor(() => {
			expect(gantt.parse).toHaveBeenCalled();
		});

		const parseCalls = (gantt.parse as vi.Mock).mock.calls;
		const lastParseCall = parseCalls[parseCalls.length - 1][0];
		const addedTask = lastParseCall.data.find((task: any) => task.id === "test-uid-123");

		expect(addedTask).toBeDefined();
		expect(addedTask).toHaveProperty("end_date");
		expect(addedTask?.end_date).toBe("2024-04-11");
		expect(addedTask?.start_date).toBe("2024-04-10");

		vi.useRealTimers();
	});

	test("JSON export includes added task with id, text, start_date, and end_date", async () => {
		const mockToday = new Date(2024, 3, 10);
		vi.setSystemTime(mockToday);
		(gantt.uid as vi.Mock).mockReturnValue("export-test-uid-456");
		(gantt.date.str_to_date as vi.Mock).mockImplementation((dateStr) => new Date(dateStr));
		(gantt.calculateEndDate as vi.Mock).mockImplementation(({ start_date, duration }) => {
			const endDate = new Date(start_date);
			endDate.setDate(start_date.getDate() + duration);
			return endDate;
		});
        (gantt.parse as vi.Mock).mockClear();

		const mockCreateObjectURL = vi.fn(() => "mock-url-export");
		const mockRevokeObjectURL = vi.fn();
		const mockLinkClick = vi.fn();

		global.URL.createObjectURL = mockCreateObjectURL;
		global.URL.revokeObjectURL = mockRevokeObjectURL;

		render(<GanttChart />);
        await waitFor(() => expect(gantt.parse).toHaveBeenCalled()); // Initial parse
        (gantt.parse as vi.Mock).mockClear();

		// Setup spies after initial render, just before they are needed for export.
		const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
		const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
		const mockCreateElement = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
			if (tagName.toLowerCase() === 'a') {
				return { href: "", download: "", click: mockLinkClick } as unknown as HTMLAnchorElement;
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
        const parseCalls = (gantt.parse as vi.Mock).mock.calls;
		const lastParsedData = parseCalls[parseCalls.length - 1][0].data;
        expect(lastParsedData.find((t: any) => t.id === "export-test-uid-456")).toBeDefined();


		const exportButton = screen.getByRole("button", { name: "JSONエクスポート" });
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

		const addedTaskInExport = exportedTasks.find((task:any) => task.id === "export-test-uid-456");
		expect(addedTaskInExport).toBeDefined();
		expect(addedTaskInExport).toEqual(expect.objectContaining({
			id: "export-test-uid-456",
			text: "New Task",
			start_date: "2024-04-10",
			end_date: "2024-04-11",
			duration: 1,
			progress: 0,
			type: gantt.config.types.TASK, // Corrected to uppercase TASK
		}));

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
		expect(screen.getByRole('heading', { name: "ガントチャート" })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: "タスク追加" })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: "JSONエクスポート" })).toBeInTheDocument();
		expect(screen.getByText("JSONインポート")).toBeInTheDocument(); // Label for a file input
		expect(screen.getByText("ズーム:")).toBeInTheDocument();
		expect(screen.getByRole('button', { name: "日" })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: "週" })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: "月" })).toBeInTheDocument();
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
