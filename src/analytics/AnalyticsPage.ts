// src/analytics/AnalyticsPage.ts

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  PieController,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

import type { BoardData } from '../data/types';
import './analytics.scss';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  PieController,
  ArcElement,
  Tooltip,
  Legend
);

export function renderAnalytics(data: BoardData) {
  const analyticsEl = document.getElementById('analytics')!;
  analyticsEl.innerHTML = `
    <canvas id="line-chart"></canvas>
    <canvas id="pie-chart"></canvas>
  `;

  // 1. Линейный график
  const dayMap = new Map<string, number>();
  data.tasks.forEach(task => {
    const date = task.deadline;
    dayMap.set(date, (dayMap.get(date) || 0) + task.spentMinutes);
  });

  const days = Array.from(dayMap.keys()).sort();
  const minutesByDay = days.map(day => dayMap.get(day) || 0);

  new Chart(document.getElementById('line-chart') as HTMLCanvasElement, {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        label: 'Минут по дням',
        data: minutesByDay,
        borderColor: 'blue',
        backgroundColor: 'rgba(0,0,255,0.1)',
        fill: true
      }]
    }
  });

  // 2. Круговая диаграмма
  const projectMap = new Map<string, number>();
  data.tasks.forEach(task => {
    projectMap.set(task.project, (projectMap.get(task.project) || 0) + task.spentMinutes);
  });

  const projects = Array.from(projectMap.keys());
  const minutesByProject = projects.map(p => projectMap.get(p) || 0);

  new Chart(document.getElementById('pie-chart') as HTMLCanvasElement, {
    type: 'pie',
    data: {
      labels: projects,
      datasets: [{
        data: minutesByProject,
        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0']
      }]
    }
  });
}
