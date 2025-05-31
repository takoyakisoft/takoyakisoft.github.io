import React, { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DraggableStateSnapshot, // Import DraggableStateSnapshot
} from 'react-beautiful-dnd';
import Task from './Task';
import styles from './GanttChart.module.css'; // Import css modules

interface TaskItem {
  id: string;
  content: string;
  startDate: string;
  endDate: string;
}

const initialTasks: TaskItem[] = [
  { id: 'task-1', content: 'タスク1: 設計フェーズ', startDate: '2024-01-01', endDate: '2024-01-15' },
  { id: 'task-2', content: 'タスク2: 開発', startDate: '2024-01-16', endDate: '2024-02-28' },
  { id: 'task-3', content: 'タスク3: テスト', startDate: '2024-03-01', endDate: '2024-03-10' },
  { id: 'task-4', content: 'タスク4: デプロイ', startDate: '2024-03-11', endDate: '2024-03-20' },
];

const GanttChart: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);

  const onDragEnd = (result: DropResult) => {
    // TODO: Implement reordering logic
    console.log('ドラッグ終了:', result);
    if (!result.destination) {
      return;
    }

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTasks(items);
  };

  const handleSave = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(tasks, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = 'gantt-data.json';
    link.click();
    link.remove();
  };

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content === 'string') {
          const parsedTasks = JSON.parse(content);
          // Basic validation (can be more sophisticated)
          if (Array.isArray(parsedTasks) && parsedTasks.every(task => 'id' in task && 'content' in task && 'startDate' in task && 'endDate' in task)) {
            setTasks(parsedTasks);
          } else {
            console.error('無効なタスクデータ構造がJSONファイルに含まれています。');
            alert('無効なタスクデータ構造がJSONファイルに含まれています。');
          }
        }
      } catch (error) {
        console.error('JSONファイルの解析中にエラーが発生しました:', error);
        alert('JSONファイルの解析中にエラーが発生しました。有効なJSONファイルであることを確認してください。');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div className={styles.controlsContainer}>
        <button type="button" onClick={handleSave}>
          保存
        </button>
        <button type="button" onClick={triggerFileInput}>
          読込
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleLoad}
        />
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="tasks">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={styles.listContainer}
            >
            <h2>タスクリスト</h2>
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot: DraggableStateSnapshot) => ( // Add snapshot
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <Task task={task} isDragging={snapshot.isDragging} /> {/* Pass isDragging */}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  </div>
  );
};

export default GanttChart;
