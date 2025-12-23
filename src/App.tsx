import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { CalendarView } from './components/calendar/CalendarView';
import { TodoList } from './components/todo/TodoList';
import { ExamOrganizer } from './components/exams/ExamOrganizer';
import { DashboardView } from './components/dashboard/DashboardView';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'todo' | 'exams'>('dashboard');

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none', height: '100%' }}>
        <DashboardView onNavigate={setActiveTab} isVisible={activeTab === 'dashboard'} />
      </div>
      {activeTab === 'calendar' && <CalendarView />}
      {activeTab === 'todo' && <TodoList />}
      {activeTab === 'exams' && <ExamOrganizer />}
    </AppShell>
  );
}

export default App;
