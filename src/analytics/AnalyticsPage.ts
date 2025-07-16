// src/analytics/AnalyticsPage.ts
import { Chart } from 'chart.js';
import type { BoardData } from '../data/types';
import './analytics.scss';

export function renderAnalytics(data: BoardData) {
  const analyticsEl = document.getElementById('analytics')!;
  analyticsEl.innerHTML = `
    <canvas id="line-chart"></canvas>
    <canvas id="pie-chart"></canvas>
  `;

  // 1. Линейный график — сколько минут потрачено в каждый день
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
        fill: false
      }]
    }
  });

  // 2. Круговая диаграмма — сколько времени ушло на каждый проект
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
