import React, { useEffect, useRef, useState } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import './GanttTaskColors.css'; // Import custom task color styles
import styles from './GanttChart.module.css';

interface DhtmlxTask {
  id: string | number;
  text: string;
  start_date: string; // Format: "YYYY-MM-DD" or "YYYY-MM-DD HH:MM"
  end_date?: string;   // Optional if duration is provided
  duration?: number;
  parent?: string | number;
  progress?: number; // Optional: 0-1
  type?: string; // Optional: 'task', 'project', 'milestone'
  open?: boolean; // Optional: whether the tree branch is opened by default
  urgency?: 'urgent' | 'not_urgent'; // New field for custom coloring
  difficulty?: 'easy' | 'difficult'; // New field for custom coloring
}

const japaneseHolidays2024 = [
  "2024-01-01", // New Year's Day
  "2024-01-08", // Coming of Age Day
  "2024-02-11", // National Foundation Day
  "2024-02-12", // Holiday in lieu
  "2024-02-23", // Emperor's Birthday
  "2024-03-20", // Vernal Equinox Day
  "2024-04-29", // Showa Day
  "2024-05-03", // Constitution Memorial Day
  "2024-05-04", // Greenery Day
  "2024-05-05", // Children's Day
  "2024-05-06", // Holiday in lieu
  "2024-07-15", // Marine Day
  "2024-08-11", // Mountain Day
  "2024-08-12", // Holiday in lieu
  "2024-09-16", // Respect for the Aged Day
  "2024-09-22", // Autumnal Equinox Day
  "2024-09-23", // Holiday in lieu
  "2024-10-14", // Sports Day
  "2024-11-03", // Culture Day
  "2024-11-04", // Holiday in lieu
  "2024-11-23", // Labour Thanksgiving Day
];

// Helper to format Date objects to "YYYY-MM-DD" string
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Original data structure for reference, will be transformed
const initialDataFromPrevLib = [
  { id: 1, name: 'タスク1: 設計フェーズ', start: new Date(2024,0,1), end: new Date(2024,2,10), type: 'task' }, // urgent, difficult
  { id: 2, name: 'タスク2: 開発', start: new Date(2024,0,16), end: new Date(2024,1,28), parentId: 1, type: 'task' }, // urgent, easy
  { id: 3, name: 'タスク3: テスト', start: new Date(2024,2,1), end: new Date(2024,2,10), parentId: 1, type: 'task' }, // not_urgent, difficult
  { id: 'milestone-1', name: 'マイルストーンA', start: new Date(2024,2,10), end: new Date(2024,2,10), type: 'milestone' },
  { id: 4, name: 'タスク4: デプロイ', start: new Date(2024,2,11), end: new Date(2024,2,20), type: 'task' }, // not_urgent, easy
];

// Transform data to dhtmlx-gantt format
const transformTasksForDhtmlx = (tasksToTransform: Array<any>): DhtmlxTask[] => {
  return tasksToTransform.map((task, index) => {
    let urgency: 'urgent' | 'not_urgent' | undefined;
    let difficulty: 'easy' | 'difficult' | undefined;

    // Assign sample urgency and difficulty for demonstration
    if (task.id === 1) { urgency = 'urgent'; difficulty = 'difficult'; }
    else if (task.id === 2) { urgency = 'urgent'; difficulty = 'easy'; }
    else if (task.id === 3) { urgency = 'not_urgent'; difficulty = 'difficult'; }
    else if (task.id === 4) { urgency = 'not_urgent'; difficulty = 'easy'; }

    return {
      id: task.id,
      text: task.name,
      start_date: formatDate(task.start),
      end_date: formatDate(task.end),
      parent: task.parentId,
      open: true,
      urgency: urgency,
      difficulty: difficulty,
    };
  });
};


const GanttChart: React.FC = () => {
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  // Using a state for tasks to allow potential updates, though dhtmlx-gantt primarily manipulates DOM directly
  const [tasks, setTasks] = useState<DhtmlxTask[]>(transformTasksForDhtmlx(initialDataFromPrevLib));

  useEffect(() => {
    if (!ganttContainerRef.current) return;

    // Basic configuration
    gantt.config.date_format = "%Y-%m-%d"; // Matches formatDate output
    gantt.config.work_time = true; // Enable working time calculation
    // gantt.config.skip_off_time = true; // If true, holidays will be skipped in duration calculation.
                                      // Set to false or comment out if holidays should be counted as regular days for task duration.
                                      // For visual highlighting only, this can be true.
    gantt.config.autosize = "y"; // Adjust height to content

    // Timeline cell class template for holiday styling
    gantt.templates.timeline_cell_class = function(task, date): string {
      const dateStr = gantt.date.date_to_str("%Y-%m-%d")(date);
      if (japaneseHolidays2024.includes(dateStr)) {
        // Check if it's a non-working day based on Gantt's own calendar logic for work_time
        // to avoid double-styling or conflicting styles if it's already a weekend.
        // 0 for Sunday, 6 for Saturday.
        if (!gantt.isWorkTime(date, 'day') || date.getDay() === 0 || date.getDay() === 6) {
          return "gantt_holiday gantt_weekend_holiday"; // Special class if it's also a weekend
        }
        return "gantt_holiday";
      }
      // Add class for standard weekends if not a holiday
      if (date.getDay() === 0 || date.getDay() === 6) {
        return "gantt_weekend";
      }
      return "";
    };

    // Task class template for custom styling
    gantt.templates.task_class = function(start, end, task: DhtmlxTask): string {
      let cssClass = "";
      if (task.urgency === 'urgent' && task.difficulty === 'easy') {
        cssClass = "gantt_task_urgent_easy";
      } else if (task.urgency === 'urgent' && task.difficulty === 'difficult') {
        cssClass = "gantt_task_urgent_difficult";
      } else if (task.urgency === 'not_urgent' && task.difficulty === 'easy') {
        cssClass = "gantt_task_not_urgent_easy";
      } else if (task.urgency === 'not_urgent' && task.difficulty === 'difficult') {
        cssClass = "gantt_task_not_urgent_difficult";
      }

      // Append default classes for milestones and selected tasks
      // Ensure task.type is compared correctly after it's been assigned
      // The `type` field in DhtmlxTask might be string from initial transform,
      // then it's mapped to gantt.config.types.milestone etc. before parsing.
      // For task_class, `task.type` will be the string value like 'milestone' or 'task'
      // if it was set by `gantt.config.types`.
      // However, if type is directly assigned in data as gantt.config.types.milestone,
      // then comparison should be `task.type === gantt.config.types.milestone`.
      // For simplicity, we'll assume `task.type` on the task object passed here
      // might be the string identifier like "milestone" if we set it that way earlier.
      // Or, it could be the actual type value. Let's check against `gantt.config.types.milestone`.
      // The `type` property on the task object available in templates is usually the string name of the type.
      if (task.type === gantt.config.types.milestone) {
           cssClass += " gantt_milestone";
      }
       // Check if task.type is 'project'. Add project specific class if needed
      if (task.type === gantt.config.types.project) {
        cssClass += " gantt_project"; // gantt_project is a common class, or use your own
      }

      if (gantt.getState().selected_task === task.id) {
          cssClass += " gantt_selected";
      }
      return cssClass;
    };

    // Explicitly enable drag features (though often true by default)
    gantt.config.drag_resize = true;
    gantt.config.drag_move = true;

    // Define columns, adding duration
    // Ensure gantt.config.skip_off_time is considered for duration display.
    // If skip_off_time is true, duration is in working days.
    // If skip_off_time is false, duration is in calendar days.
    gantt.config.columns = [
      { name: "text", label: "タスク名", tree: true, width: '*' , resize: true },
      { name: "start_date", label: "開始日", align: "center", width: 100, resize: true },
      { name: "end_date", label: "終了日", align: "center", width: 100, resize: true },
      { name: "duration", label: "期間", align: "center", width: 60, resize: true },
    ];

    // Assign types after gantt is available
    // This mapping should happen consistently for both initial load and updates
    const getTypedTasks = (currentTasks: DhtmlxTask[]): DhtmlxTask[] => {
      return currentTasks.map(task => ({
        ...task,
        // Ensure 'type' is correctly assigned for dhtmlx-gantt to recognize milestones/projects
        // This logic assumes 'milestone-1' is always a milestone.
        // A more robust way would be to include type in initialDataFromPrevLib and transform it.
        type: task.id === 'milestone-1' ? gantt.config.types.milestone : gantt.config.types.task,
      }));
    };

    // Initialize Gantt
    gantt.init(ganttContainerRef.current);

    // Load data
    gantt.parse({ data: getTypedTasks(tasks) });

    // Cleanup on unmount
    return () => {
      gantt.clearAll();
    };
  }, []); // Run once on mount. Be careful with dependencies if gantt, tasks, etc. are used from outside.

  // Effect for handling task updates if `tasks` state changes from React's perspective
  useEffect(() => {
    // This effect will run if the `tasks` state managed by React changes.
    // It re-initializes the types and re-parses the data.
    const getTypedTasks = (currentTasks: DhtmlxTask[]): DhtmlxTask[] => {
      return currentTasks.map(task => ({
        ...task,
        type: task.id === 'milestone-1' ? gantt.config.types.milestone : gantt.config.types.task,
      }));
    };

    gantt.clearAll();
    gantt.parse({ data: getTypedTasks(tasks) });
    // gantt.refreshData(); // Alternatively, if data structure is maintained by dhtmlx-gantt
  }, [tasks]); // Re-run if `tasks` array reference changes


  return (
    <div className={styles.ganttContainerWrapper}>
      <h2>Gantt Chart (dhtmlx-gantt)</h2>
      <div
        ref={ganttContainerRef}
        className={styles.ganttChartArea} // Apply specific styles for height, etc.
        style={{ width: '100%', height: '500px' }} // Ensure container has dimensions
      />
    </div>
  );
};

export default GanttChart;
