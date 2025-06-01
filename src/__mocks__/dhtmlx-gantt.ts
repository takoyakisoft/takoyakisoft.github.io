// src/components/__mocks__/dhtmlx-gantt.ts
export const gantt = {
  templates: {
    // Add any templates that are accessed
    task_class: vi.fn(),
    timeline_cell_class: vi.fn(),
  },
  i18n: {
    setLocale: vi.fn(),
  },
  getGanttInstance: vi.fn(() => ({ // Use vi.fn() for Vitest mocks
    // Mock the instance methods that are called
    init: vi.fn(),
    parse: vi.fn(),
    render: vi.fn(),
    clearAll: vi.fn(),
    attachEvent: vi.fn(),
    detachEvent: vi.fn(),
    // Add any other methods or properties used by your component
  })),
  init: vi.fn(),
  parse: vi.fn(),
  render: vi.fn(),
  clearAll: vi.fn(),
  attachEvent: vi.fn(),
  detachEvent: vi.fn(),
  // Add other properties from the real gantt object that might be accessed
  config: {
    date_format: "%Y-%m-%d",
    drag_resize: true,
    drag_move: true,
    columns: [], // Define further if specific columns are checked
    // Add other config properties accessed in the component
    scales: [],
    min_column_width: 0,
    types: { TASK: 'task', PROJECT: 'project', MILESTONE: 'milestone' }, // Add task types if accessed
  },
  date: { // Add gantt.date if it's used (e.g. by templates)
    date_to_str: vi.fn().mockReturnValue(vi.fn()), // Mocking a function that returns a function
  },
  getState: vi.fn().mockReturnValue({ selected_task: null }), // Mock getState if used
  // Add any other properties or methods from the gantt object that your component uses
};

export default gantt; // If the component imports 'dhtmlx-gantt' directly
