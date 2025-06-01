// src/components/__mocks__/dhtmlx-gantt.ts
export const gantt = {
  templates: {
    // Add any templates that are accessed
    task_class: vi.fn(),
    timeline_cell_class: vi.fn(),
    format_date: vi.fn((date) => { // Mock for format_date
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      return String(date); // Fallback if not a Date object
    }),
  },
  i18n: {
    setLocale: vi.fn(),
  },
  locale: { // Added locale object
    labels: { // Added labels object
      icon_save: "", // Default empty or English
      icon_cancel: "",
      icon_delete: "",
      section_description: "",
      section_time: "",
      confirm_deleting_title: "", // Added for delete confirmation
      confirm_deleting: "",       // Added for delete confirmation
      message_ok: "OK",           // Standard OK
      message_cancel: "Cancel",   // Standard Cancel
      // Add other labels if they are set or accessed
    },
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
  // attachEvent will be replaced by a custom mock implementation
  // detachEvent will be replaced by a custom mock implementation
  getTask: vi.fn(),
  refreshTask: vi.fn(),
  // Add other properties from the real gantt object that might be accessed
  config: {
    date_format: "%Y-%m-%d",
    drag_resize: true,
    drag_move: true,
    columns: [],
    // Add other config properties accessed in the component
    scales: [],
    min_column_width: 0,
    types: { TASK: 'task', PROJECT: 'project', MILESTONE: 'milestone' },
    duration_unit: "day", // Add default duration_unit
    // date_format is already defined at the top of config block
  },
  date: {
    date_to_str: vi.fn().mockReturnValue(vi.fn()),
    str_to_date: vi.fn((dateStr, format) => new Date(dateStr)),
    parseDate: vi.fn((dateStr, format) => new Date(dateStr)),
  },
  getState: vi.fn().mockReturnValue({ selected_task: null }),
  uid: vi.fn(),
  calculateEndDate: vi.fn(),
  confirm: vi.fn(),
  deleteTask: vi.fn(),
  isTaskExists: vi.fn(),
  moveTask: vi.fn(), // Added moveTask mock
  serialize: vi.fn(), // Added serialize mock
  // Add any other properties or methods from the gantt object that your component uses

  // Custom mock for event handling to simplify tests
  __attachedEventHandlers: {} as Record<string, ((...args: any[]) => any)[]>,
  attachEvent: vi.fn(function(this: any, eventName: string, handler: (...args: any[]) => any) {
    if (!this.__attachedEventHandlers[eventName]) {
      this.__attachedEventHandlers[eventName] = [];
    }
    this.__attachedEventHandlers[eventName].push(handler);
    const eventId = `${eventName}_${this.__attachedEventHandlers[eventName].length}`;
    return eventId;
  }),
  detachEvent: vi.fn(function(this: any, eventId: string) {
    // Basic mock for detachEvent.
    // More sophisticated cleanup could be implemented if needed for specific eventId.
  }),
  __getAttachedHandlers: function(this: any, eventName: string) {
    return this.__attachedEventHandlers[eventName] || [];
  },
  __clearAttachedHandlers: function(this: any) {
    this.__attachedEventHandlers = {};
  }
};

export default gantt;
