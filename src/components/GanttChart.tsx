import { gantt } from "dhtmlx-gantt";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";
import "./GanttTaskColors.css"; // Import custom task color styles
import styles from "./GanttChart.module.css";

interface DhtmlxTask {
	id: string | number;
	text: string;
	start_date: string; // Format: "YYYY-MM-DD" or "YYYY-MM-DD HH:MM"
	end_date?: string; // Optional if duration is provided
	duration?: number;
	parent?: string | number;
	progress?: number; // Optional: 0-1
	type?: string; // Optional: 'task', 'project', 'milestone'
	open?: boolean; // Optional: whether the tree branch is opened by default
	urgency?: "urgent" | "not_urgent"; // New field for custom coloring
	difficulty?: "easy" | "difficult"; // New field for custom coloring
}

interface InitialTask {
	id: number | string;
	name: string;
	start: Date;
	end: Date;
	parentId?: number;
	type: string;
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
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return `${year}-${month}-${day}`;
};

// Original data structure for reference, will be transformed
const initialDataFromPrevLib = [
	{
		id: 1,
		name: "タスク1: 設計フェーズ",
		start: new Date(2024, 0, 1),
		end: new Date(2024, 2, 10),
		type: "task",
	}, // urgent, difficult
	{
		id: 2,
		name: "タスク2: 開発",
		start: new Date(2024, 0, 16),
		end: new Date(2024, 1, 28),
		parentId: 1,
		type: "task",
	}, // urgent, easy
	{
		id: 3,
		name: "タスク3: テスト",
		start: new Date(2024, 2, 1),
		end: new Date(2024, 2, 10),
		parentId: 1,
		type: "task",
	}, // not_urgent, difficult
	{
		id: "milestone-1",
		name: "マイルストーンA",
		start: new Date(2024, 2, 10),
		end: new Date(2024, 2, 10),
		type: "milestone",
	},
	{
		id: 4,
		name: "タスク4: デプロイ",
		start: new Date(2024, 2, 11),
		end: new Date(2024, 2, 20),
		type: "task",
	}, // not_urgent, easy
];

// Transform data to dhtmlx-gantt format
const transformTasksForDhtmlx = (
	tasksToTransform: Array<InitialTask>,
): DhtmlxTask[] => {
	return tasksToTransform.map((task, index) => {
		let urgency: "urgent" | "not_urgent" | undefined;
		let difficulty: "easy" | "difficult" | undefined;

		// Assign sample urgency and difficulty for demonstration
		if (task.id === 1) {
			urgency = "urgent";
			difficulty = "difficult";
		} else if (task.id === 2) {
			urgency = "urgent";
			difficulty = "easy";
		} else if (task.id === 3) {
			urgency = "not_urgent";
			difficulty = "difficult";
		} else if (task.id === 4) {
			urgency = "not_urgent";
			difficulty = "easy";
		}

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

const zoomLevels = [
	{
		name: "Day",
		scales: [
			{ unit: "month", step: 1, format: "%F, %Y" },
			{ unit: "day", step: 1, format: "%j, %D" },
		],
		min_column_width: 60,
	},
	{
		name: "Week",
		scales: [
			{ unit: "month", step: 1, format: "%F, %Y" },
			{ unit: "week", step: 1, format: "Week #%W" },
		],
		min_column_width: 100,
	},
	{
		name: "Month",
		scales: [
			{ unit: "year", step: 1, format: "%Y" },
			{ unit: "month", step: 1, format: "%F" },
		],
		min_column_width: 120,
	},
];

const GanttChart: React.FC = () => {
	const ganttContainerRef = useRef<HTMLDivElement>(null);
	const [tasks, setTasks] = useState<DhtmlxTask[]>(
		transformTasksForDhtmlx(initialDataFromPrevLib),
	);
	const tasksRef = useRef<DhtmlxTask[]>(tasks); // Ref to hold current tasks for event handlers

	useEffect(() => {
		tasksRef.current = tasks;
	}, [tasks]);

	const [currentZoomLevelName, setCurrentZoomLevelName] = useState<string>(
		zoomLevels[1].name,
	); // Default to Week view

	const setZoomConfiguration = useCallback((levelName: string) => {
		const zoomConfig = zoomLevels.find((zl) => zl.name === levelName);
		if (zoomConfig && gantt) {
			gantt.config.scales = zoomConfig.scales;
			gantt.config.min_column_width = zoomConfig.min_column_width;
			if (ganttContainerRef.current && gantt && typeof gantt.render === 'function') {
				// Check if gantt is initialized
				gantt.render();
			}
			setCurrentZoomLevelName(levelName);
		}
	}, []);

	// Task deletion handler
	const handleDeleteTask = useCallback(
		(taskId: string | number) => {
			const task = gantt.getTask(taskId); // Get task details for the confirmation message
			const taskText = task ? `"${task.text}" ` : `task #${taskId} `;

			gantt.confirm({
				title: gantt.locale.labels.confirm_deleting_title || "タスクの削除", // Default or use a more specific key
				text: gantt.locale.labels.confirm_deleting ? `${gantt.locale.labels.confirm_deleting} ${taskText}` : `タスク ${taskText}を削除してもよろしいですか？`,
				ok: gantt.locale.labels.message_ok || "OK", // Standard OK
				cancel: gantt.locale.labels.message_cancel || "キャンセル", // Standard Cancel
				callback: (result) => {
					if (result) {
						setTasks((prevTasks) => prevTasks.filter((taskItem) => taskItem.id !== taskId));
						if (gantt.isTaskExists(taskId)) {
							gantt.deleteTask(taskId);
						}
					}
				},
			});
		},
		[setTasks],
	);

	useEffect(() => {
		if (!ganttContainerRef.current) return;

		// Apply Japanese locale
		gantt.i18n.setLocale("jp");

		// Explicit Lightbox translations
		gantt.locale.labels.icon_save = "保存";
		gantt.locale.labels.icon_cancel = "キャンセル";
		gantt.locale.labels.icon_delete = "削除";
		gantt.locale.labels.section_description = "説明";
		gantt.locale.labels.section_time = "期間";

		// Basic configuration
		gantt.config.date_format = "%Y-%m-%d";
		gantt.config.work_time = true;
		gantt.config.autosize = "y";

		// Set initial zoom configuration
		// setZoomConfiguration(currentZoomLevelName); // Call this after gantt.init

		// Timeline cell class template for holiday styling
		gantt.templates.timeline_cell_class = (task, date): string => {
			const dateStr = gantt.date.date_to_str("%Y-%m-%d")(date);
			if (japaneseHolidays2024.includes(dateStr)) {
				// Check if it's a non-working day based on Gantt's own calendar logic for work_time
				// to avoid double-styling or conflicting styles if it's already a weekend.
				// 0 for Sunday, 6 for Saturday.
				if (
					!gantt.isWorkTime(date, "day") ||
					date.getDay() === 0 ||
					date.getDay() === 6
				) {
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
		gantt.templates.task_class = (start, end, task: DhtmlxTask): string => {
			let cssClass = "";
			if (task.urgency === "urgent" && task.difficulty === "easy") {
				cssClass = "gantt_task_urgent_easy";
			} else if (task.urgency === "urgent" && task.difficulty === "difficult") {
				cssClass = "gantt_task_urgent_difficult";
			} else if (task.urgency === "not_urgent" && task.difficulty === "easy") {
				cssClass = "gantt_task_not_urgent_easy";
			} else if (
				task.urgency === "not_urgent" &&
				task.difficulty === "difficult"
			) {
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
			{ name: "text", label: "タスク名", tree: true, width: "*", resize: true },
			{
				name: "start_date",
				label: "開始日",
				align: "center",
				width: 100,
				resize: true,
			},
			{
				name: "end_date",
				label: "終了日",
				align: "center",
				width: 100,
				resize: true,
			},
			{
				name: "duration",
				label: "期間",
				align: "center",
				width: 60,
				resize: true,
			},
			{
				name: "actions",
				label: "Actions",
				width: 44, // Width for a small icon button
				align: "center",
				template: (task: DhtmlxTask) => {
					// Return an HTML string for the delete button
					// Ensure taskId is correctly passed. task.id should be available.
					return `<div class="gantt_delete_button" onclick="window.handleGanttTaskDelete?.('${task.id}')">🗑️</div>`;
				},
			},
		];

		// Assign types after gantt is available
		// This mapping should happen consistently for both initial load and updates
		const getTypedTasks = (currentTasks: DhtmlxTask[]): DhtmlxTask[] => {
			return currentTasks.map((task) => ({
				...task,
				// Ensure 'type' is correctly assigned for dhtmlx-gantt to recognize milestones/projects
				// This logic assumes 'milestone-1' is always a milestone.
				// A more robust way would be to include type in initialDataFromPrevLib and transform it.
				type:
					task.id === "milestone-1"
						? gantt.config.types.milestone
						: gantt.config.types.task,
			}));
		};

		// Initialize Gantt
		gantt.init(ganttContainerRef.current);
		setZoomConfiguration(currentZoomLevelName); // Apply initial zoom after init

		const onBeforeRowDragEndId = gantt.attachEvent(
			"onBeforeRowDragEnd",
			(id, parent, tindex) => {
				// id: ID of the dragged task
				// parent: ID of the target parent task (root if undefined or matches gantt.config.root_id)
				// tindex: Zero-based index within the target parent's children

				gantt.moveTask(id, tindex, parent);

				// Update React state to reflect the new order
				const serializedGantt = gantt.serialize(); // { data: DhtmlxTask[], links: Link[] }
				const newOrderedGanttTasks = serializedGantt.data;

				// Create a map of existing tasks for easy lookup and preserving custom props
				const currentTasksMap = new Map(tasksRef.current.map(task => [task.id, task]));

				const adaptedTasks = newOrderedGanttTasks.map(ganttTask => {
					const existingTask = currentTasksMap.get(ganttTask.id);
					return {
						...existingTask, // Preserve custom properties like urgency, difficulty
						id: ganttTask.id,
						text: ganttTask.text, // Gantt typically uses 'text'
						start_date: formatDate(ganttTask.start_date as unknown as Date), // gantt.serialize returns Date objects
						end_date: formatDate(ganttTask.end_date as unknown as Date), // gantt.serialize returns Date objects
						duration: ganttTask.duration,
						parent: ganttTask.parent, // parent ID from Gantt
						progress: ganttTask.progress,
						type: ganttTask.type, // type from Gantt
						open: ganttTask.open !== undefined ? ganttTask.open : true, // preserve open state or default
						// Ensure all DhtmlxTask fields are covered
						urgency: existingTask?.urgency,
						difficulty: existingTask?.difficulty,
					};
				});

				setTasks(adaptedTasks);
				return false; // Prevent default processing
			},
		);

		// Load data
		gantt.parse({ data: getTypedTasks(tasks) });

		const onAfterTaskDragId = gantt.attachEvent(
			"onAfterTaskDrag",
			(id, mode, e) => {
				const task = gantt.getTask(id);
				setTasks((prevTasks) =>
					prevTasks.map((t) =>
						t.id === id
							? {
									...t,
									start_date: gantt.templates.format_date(task.start_date),
									end_date: gantt.templates.format_date(task.end_date),
									duration: task.duration,
							  }
							: t,
					),
				);
				gantt.refreshTask(id); // Consider if needed after state update
				return true;
			},
		);

		const onLightboxSaveId = gantt.attachEvent(
			"onLightboxSave",
			(id, task, isNew) => {
				setTasks((prevTasks) =>
					prevTasks.map((t) =>
						t.id === id
							? {
									...t,
									text: task.text,
									start_date: gantt.templates.format_date(task.start_date),
									end_date: gantt.templates.format_date(task.end_date),
									duration: task.duration,
									progress: task.progress,
									// parent: task.parent, // Parent updates might need more complex handling
									type: task.type,
									// Add any other fields that can be edited in the lightbox
							  }
							: t,
					),
				);
				gantt.refreshTask(id); // Consider if needed
				return true; // Important to return true to save changes
			},
		);

		// Expose handleDeleteTask globally for the template button
		(window as any).handleGanttTaskDelete = handleDeleteTask;


		// Cleanup on unmount
		return () => {
			gantt.detachEvent(onBeforeRowDragEndId);
			gantt.detachEvent(onAfterTaskDragId);
			gantt.detachEvent(onLightboxSaveId);
			// Clean up global function
			delete (window as any).handleGanttTaskDelete;
			gantt.clearAll();
		};
	}, [currentZoomLevelName, setZoomConfiguration, tasks, handleDeleteTask]);

	// Note: The comment about removing a duplicate useEffect that watched [tasks] might refer to an old state.
	// The current main useEffect correctly includes `tasks` in its dependency array.

	const handleAddTask = () => {
		const today = new Date();
		const newTask: DhtmlxTask = {
			id: gantt.uid(),
			text: "New Task",
			start_date: formatDate(today), // formatDate is defined above
			duration: 1,
			progress: 0,
			type: gantt.config.types.TASK, // Corrected to uppercase TASK
		};

		// Calculate end_date
		const dateFormat = gantt.config.date_format || "%Y-%m-%d"; // Provide a fallback or ensure it's set
		const dateParts = newTask.start_date.split('-');
		const startDateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

		if (startDateObj && typeof newTask.duration === 'number') {
			const endDateObj = gantt.calculateEndDate({
				start_date: startDateObj,
				duration: newTask.duration,
				unit: gantt.config.duration_unit || "day", // Provide a fallback for duration_unit as well
			});
			if (endDateObj) { // Check if endDateObj is valid
				newTask.end_date = formatDate(endDateObj);
			} else {
				// Handle error: unable to calculate end date
				console.error("Error calculating end date for new task", newTask);
				// Optionally, set a default end_date or leave it undefined based on requirements
				// For example, set it to start_date + duration manually if gantt fails
				const fallbackEndDate = new Date(startDateObj);
				fallbackEndDate.setDate(startDateObj.getDate() + newTask.duration);
				newTask.end_date = formatDate(fallbackEndDate);
			}
		} else {
			// Handle error: unable to parse start_date or duration is invalid
			console.error("Error parsing start_date or invalid duration for new task", newTask, "Parsed Start Date:", startDateObj);
			// Optionally, set a default end_date or start_date if it failed to parse
			// If startDateObj is null, newTask.start_date might be problematic or dateFormat
			// For now, if startDateObj is null, end_date will remain undefined.
            // A robust solution might be to ensure formatDate always produces a string gantt can parse,
            // and that gantt.config.date_format is reliably set during initialization.
            // The current formatDate function produces "YYYY-MM-DD" which should be fine with "%Y-%m-%d".
            // If startDateObj is null, it implies an issue with gantt.date.str_to_date itself or its config.
            // Adding a fallback for end_date if start_date was parseable but duration calculation failed.
            if (startDateObj && typeof newTask.duration === 'number') {
                 const fallbackEndDate = new Date(startDateObj);
                 fallbackEndDate.setDate(startDateObj.getDate() + newTask.duration);
                 newTask.end_date = formatDate(fallbackEndDate);
            }
		}

		setTasks((prevTasks) => [...prevTasks, newTask]);
		// Ensure the lightbox opens for the new task.
		// It's often better to do this after Gantt has processed the new task.
		// A common pattern is to use gantt.attachEvent("onTaskCreated", ...)
		// or call showLightbox after a brief timeout if direct call doesn't work.
		// For now, let's assume the re-parse might be enough, or we can refine.
		// If issues, this is a place to investigate:
		// setTimeout(() => {
		//   if (gantt.isTaskExists(newTask.id)) {
		//     gantt.showLightbox(newTask.id);
		//   }
		// }, 100); // Small delay to ensure task is rendered
	};

	const handleExportJson = () => {
		// For now, export tasks as they are in the state.
		// Consider stripping any runtime properties added by dhtmlx-gantt if necessary for cleaner export.
		const jsonString = JSON.stringify(tasks, null, 2);
		const blob = new Blob([jsonString], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "gantt_tasks.json";
		document.body.appendChild(a); // Required for Firefox
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target?.result;
				if (typeof content !== "string") {
					alert("Failed to read file content.");
					return;
				}
				const importedTasks = JSON.parse(content);

				// Basic validation
				if (
					!Array.isArray(importedTasks) ||
					!importedTasks.every(
						(task) =>
							typeof task.id !== "undefined" &&
							typeof task.text === "string" &&
							typeof task.start_date === "string",
						// Add more checks as needed, e.g., for date format, duration, etc.
					)
				) {
					alert(
						"Invalid JSON structure or missing essential task properties (id, text, start_date).",
					);
					return;
				}

				setTasks(importedTasks as DhtmlxTask[]); // Assuming imported tasks match DhtmlxTask structure
			} catch (error) {
				console.error("Error parsing JSON file:", error);
				alert("Failed to parse JSON file. Please ensure it's a valid JSON.");
			} finally {
				// Reset file input to allow importing the same file again
				if (event.target) {
					event.target.value = "";
				}
			}
		};

		reader.onerror = () => {
			console.error("Error reading file:", reader.error);
			alert("Failed to read file.");
			if (event.target) {
				event.target.value = "";
			}
		};

		reader.readAsText(file);
	};

	return (
		<div className={styles.ganttContainerWrapper}>
			<h2>ガントチャート</h2>
			<div className={styles.controlsContainer}>
				<button type="button" onClick={handleAddTask}>
					タスク追加
				</button>
				<button
					type="button"
					onClick={handleExportJson}
					style={{ marginLeft: "10px" }}
				>
					JSONエクスポート
				</button>
				{/* File input styled as a button */}
				<label
					htmlFor="import-json-file"
					className={styles.buttonLikeLabel}
					style={{ marginLeft: "10px" }}
				>
					JSONインポート
				</label>
				<input
					type="file"
					id="import-json-file"
					accept=".json"
					onChange={handleImportJson}
					style={{ display: "none" }}
				/>
			</div>
			<div className={styles.controlsContainer} style={{ marginTop: "10px" }}>
				<span>ズーム: </span>
				{zoomLevels.map((level) => (
					<button
						type="button"
						key={level.name}
						onClick={() => setZoomConfiguration(level.name)}
						style={{
							marginLeft: "5px",
							backgroundColor:
								currentZoomLevelName === level.name ? "#d3d3d3" : undefined,
						}}
						disabled={currentZoomLevelName === level.name}
					>
						{level.name === "Day" ? "日" : level.name === "Week" ? "週" : "月"}
					</button>
				))}
			</div>
			<div
				ref={ganttContainerRef}
				className={styles.ganttChartArea} // Apply specific styles for height, etc.
				style={{ width: "100%", height: "500px" }} // Ensure container has dimensions
				aria-label="gantt-chart-area" // Added for testability
			/>
		</div>
	);
};

export default GanttChart;
