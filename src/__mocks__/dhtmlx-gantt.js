// src/__mocks__/dhtmlx-gantt.js

// Create a spy-able object for the gantt instance
const gantt = {
	// Methods
	init: jest.fn(),
	parse: jest.fn(),
	clearAll: jest.fn(),
	render: jest.fn(), // Added for completeness, might be called internally or by templates
	refreshData: jest.fn(), // Added for completeness
	setWorkTime: jest.fn(), // If we were to use it for holidays
	isWorkTime: jest.fn().mockReturnValue(true), // Default to working day for tests unless specified

	// Properties (config, templates, date, types, getState)
	config: {
		date_format: "",
		columns: [],
		drag_resize: false,
		drag_move: false,
		work_time: false,
		skip_off_time: false,
		autosize: false,
		// Add any other config properties accessed in GanttChart.tsx
		// Initialize with default values that can be asserted against or changed by the component
		types: {
			TASK: "task", // Standard type
			PROJECT: "project", // Standard type
			MILESTONE: "milestone", // Standard type
		},
	},
	templates: {
		task_class: null,
		timeline_cell_class: null,
		// Add any other templates accessed
	},
	date: {
		// Mock the curried function date_to_str
		date_to_str: jest.fn().mockImplementation((format) => {
			return jest.fn((date) => {
				// Return a mock date string or implement a simple formatter for testing
				if (date && format) {
					const year = date.getFullYear();
					const month = (date.getMonth() + 1).toString().padStart(2, "0");
					const day = date.getDate().toString().padStart(2, "0");
					if (format === "%Y-%m-%d") return `${year}-${month}-${day}`;
					return "mock-date-string";
				}
				return "mock-date-string";
			});
		}),
		// Add any other date functions used
	},
	getState: jest.fn().mockReturnValue({
		selected_task: null,
		// Add any other state properties accessed
	}),

	// Event system (if event handlers are attached in React component)
	attachEvent: jest.fn(),
	detachEvent: jest.fn(),

	// For convenience, allow resetting all mocks
	__resetMocks: () => {
		gantt.init.mockClear();
		gantt.parse.mockClear();
		gantt.clearAll.mockClear();
		gantt.render.mockClear();
		gantt.refreshData.mockClear();
		gantt.setWorkTime.mockClear();
		gantt.isWorkTime.mockClear().mockReturnValue(true);
		gantt.date.date_to_str
			.mockClear()
			.mockImplementation((format) => jest.fn((date) => "mock-date-string"));
		gantt.getState.mockClear().mockReturnValue({ selected_task: null });
		gantt.attachEvent.mockClear();
		gantt.detachEvent.mockClear();
		// Reset config and templates to initial mock state if necessary
		gantt.config = {
			date_format: "",
			columns: [],
			drag_resize: false,
			drag_move: false,
			work_time: false,
			skip_off_time: false,
			autosize: false,
			types: { TASK: "task", PROJECT: "project", MILESTONE: "milestone" },
		};
		gantt.templates = { task_class: null, timeline_cell_class: null };
	},
};

export { gantt };
