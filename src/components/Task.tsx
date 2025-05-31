import React from 'react';
import styles from './GanttChart.module.css'; // Assuming Task.tsx is in the same folder

export interface TaskProps {
  task: {
    id: string;
    content: string;
    startDate: string;
    endDate: string;
  };
  isDragging?: boolean; // Added to apply different styles when dragging
}

const Task: React.FC<TaskProps> = ({ task, isDragging }) => {
  const taskItemClasses = `${styles.taskItem} ${isDragging ? styles.draggingTaskItem : ''}`;

  return (
    <div className={taskItemClasses}>
      <div className={styles.taskContent}>{task.content}</div>
      <div className={styles.taskDates}>
        開始: {task.startDate} - 終了: {task.endDate}
      </div>
    </div>
  );
};

export default Task;
