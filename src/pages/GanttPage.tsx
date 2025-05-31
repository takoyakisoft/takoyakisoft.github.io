import React from 'react';
import GanttChart from '../components/GanttChart';

const GanttPage: React.FC = () => {
  return (
    <div>
      <h1>ガントチャート</h1>
      <p>タスクをドラッグ＆ドロップして順序を変更したり、JSONファイルとして保存・読込ができます。</p>
      <GanttChart />
    </div>
  );
};

export default GanttPage;
