import "./styles/style.scss";
import { loadBoard, saveBoard } from './utils/storage';
import type { Task, TaskStatus } from './data/types';
import { exportBoard, importBoard } from './utils/exportimport';
import { renderAnalytics } from './analytics/AnalyticsPage';

const statuses: TaskStatus[] = ['todo', 'in-progress', 'done'];
const boardEl = document.getElementById('board')!;
const boardData = loadBoard();
const activeTimers = new Map<string, number>();
const activeSeconds = new Map<string, number>();


function updateTaskPriorities(tasks: Task[]) {
  const now = new Date();
  tasks.forEach(task => {
    if (!task.deadline) {
      task.priority = undefined;
      return;
    }
    const deadline = new Date(task.deadline);
    const diff = deadline.getTime() - now.getTime();
    if (diff <= 2 * 24 * 60 * 60 * 1000 && diff >= 0) {
      task.priority = 'urgent';
    } else if (diff > 3 * 24 * 60 * 60 * 1000) {
      task.priority = 'secondary';
    } else if (diff < 0) {
      task.priority = 'postpone';
    } else {
      task.priority = undefined;
    }
  });
}

function createTaskCard(task: Task): HTMLElement {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.draggable = true;
  card.dataset.id = task.id;
  card.innerHTML = `
    <strong>${task.title}</strong>
    <span>Проект: ${task.project}</span>
    <span>План: ${task.plannedMinutes} мин</span>
    <span>Выполнено: <span class="spent">${task.spentMinutes}</span> мин</span>
    <span>Срок: ${task.deadline}</span>
    <span class="timer-display"></span>
    <div class="task-buttons">
      <button class="btn small start-btn">▶ Старт</button>
      <button class="btn small add-btn">➕ Минуты</button>
      <button class="btn small delete-btn">🗑 Удалить</button>
    </div>
  `;

  const startBtn = card.querySelector('.start-btn') as HTMLButtonElement;
  const addBtn = card.querySelector('.add-btn') as HTMLButtonElement;
  const timerDisplay = card.querySelector('.timer-display') as HTMLSpanElement;
  const spentSpan = card.querySelector('.spent') as HTMLSpanElement;
  const deleteBtn = card.querySelector('.delete-btn') as HTMLButtonElement;

  // Отображение правильного текста на кнопке
  if (task.status === 'in-progress') {
    startBtn.textContent = '✔ Завершить';
  } else {
    startBtn.textContent = '▶ Старт';
  }

  // Удаление задачи
  deleteBtn.addEventListener('click', () => {
    if (confirm('Удалить эту задачу?')) {
      const index = boardData.tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        boardData.tasks.splice(index, 1);
        saveBoard(boardData);
        renderBoard();
      }
    }
  });

  // Добавление минут вручную
  addBtn.addEventListener('click', () => {
    const input = prompt('Сколько минут добавить?');
    const extra = Number(input);
    if (!isNaN(extra) && extra > 0) {
      task.spentMinutes += extra;
      spentSpan.textContent = task.spentMinutes.toString();
      saveBoard(boardData);
      alert(`Добавлено ${extra} минут.`);
    } else {
      alert('Введите корректное число минут.');
    }
  });

  // Если задача уже завершена
  if (task.status === 'done') {
    timerDisplay.textContent = `✅ Выполнено за ${task.spentMinutes} мин`;
    startBtn.remove();
    addBtn.remove();
    return card;
  }

  // Если задача уже была запущена ранее — продолжаем отсчёт
  if (task.startTime) {
    const passed = Math.floor((Date.now() - task.startTime) / 1000);
    activeSeconds.set(task.id, passed);
    timerDisplay.textContent = `⏱ ${passed} сек`;
    spentSpan.textContent = task.spentMinutes.toString();
    startTimer(task, spentSpan, timerDisplay);
  }

  // Логика старта/завершения задачи
  startBtn.addEventListener('click', () => {
    if (task.status === 'todo') {
      task.status = 'in-progress';
      task.startTime = Date.now();
      activeSeconds.set(task.id, 0);
      saveBoard(boardData);
      startTimer(task, spentSpan, timerDisplay);
       renderBoard();
      startBtn.textContent = '✔ Завершить';
      return;
    }

    if (task.status === 'in-progress') {
      const confirmDone = confirm('Завершить задачу?');
      if (!confirmDone) return;

      const intervalId = activeTimers.get(task.id);
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        activeTimers.delete(task.id);
        const secondsElapsed = activeSeconds.get(task.id) ?? 0;
        task.spentMinutes += Math.floor(secondsElapsed / 60);
        activeSeconds.delete(task.id);
      }

      if (task.startTime) {
        const extra = Math.floor((Date.now() - task.startTime) / 1000);
        task.spentMinutes += Math.floor(extra / 60);
        task.startTime = undefined;
      }

      task.status = 'done';
      saveBoard(boardData);
      renderBoard();
    }
  });
// Сброс, если вручную вернули в 'todo'
if (task.status === 'todo') {
  const intervalId = activeTimers.get(task.id);
  if (intervalId !== undefined) {
    clearInterval(intervalId);
    activeTimers.delete(task.id);
    activeSeconds.delete(task.id);
  }
  task.startTime = undefined;
  startBtn.textContent = '▶ Старт';
  timerDisplay.textContent = '';
  spentSpan.textContent = task.spentMinutes.toString();
}

  return card;
}


function startTimer(task: Task, spentSpan: HTMLElement, timerDisplay: HTMLElement) {
  const taskId = task.id;
  let seconds = activeSeconds.get(taskId) ?? 0;
  if (!task.startTime) task.startTime = Date.now();
  timerDisplay.textContent = `⏱ ${seconds} сек`;

  const interval = window.setInterval(() => {
    seconds++;
    activeSeconds.set(taskId, seconds);
    timerDisplay.textContent = `⏱ ${seconds} сек`;
    if (seconds % 60 === 0) {
      task.spentMinutes += 1;
      spentSpan.textContent = task.spentMinutes.toString();
    }
    saveBoard(boardData);
  }, 1000);

  activeTimers.set(taskId, interval);
  saveBoard(boardData);
}

function renderBoard() {
  updateTaskPriorities(boardData.tasks); // ⬅️ [НОВОЕ]
  boardEl.innerHTML = '';
  statuses.forEach(status => {
    const column = document.createElement('div');
    column.className = 'kanban-column';
    column.dataset.status = status;
    column.innerHTML = `<h3>${getStatusName(status)}</h3>`;
    const container = document.createElement('div');
    container.className = 'kanban-tasks';

    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      column.classList.add('drag-over');
    });
    column.addEventListener('dragleave', () => {
      column.classList.remove('drag-over');
    });
    column.addEventListener('drop', (e) => {
      column.classList.remove('drag-over');
      onDrop(e, status);
    });

    boardData.tasks
      .filter(task => task.status === status)
      .forEach(task => {
        const card = createTaskCard(task);
        card.addEventListener('dragstart', onDragStart);
        container.appendChild(card);
      });

    column.appendChild(container);
    boardEl.appendChild(column);
  });
}

function onDragStart(e: DragEvent) {
  const target = e.target as HTMLElement;
  if (target?.dataset?.id) {
    e.dataTransfer?.setData('text/plain', target.dataset.id);
  }
}

function onDrop(e: DragEvent, newStatus: TaskStatus) {
  e.preventDefault();
  const taskId = e.dataTransfer?.getData('text/plain');
  if (!taskId) return;

  const task = boardData.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.status = newStatus;

  if (newStatus === 'done') {
    const intervalId = activeTimers.get(taskId);
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      activeTimers.delete(taskId);
      const secondsElapsed = activeSeconds.get(taskId) ?? 0;
      task.spentMinutes += Math.floor(secondsElapsed / 60);
      activeSeconds.delete(taskId);
    }
    if (task.startTime) {
      const extra = Math.floor((Date.now() - task.startTime) / 1000);
      task.spentMinutes += Math.floor(extra / 60);
      task.startTime = undefined;
    }
  }

  saveBoard(boardData);
  renderBoard();
}

function getStatusName(status: TaskStatus): string {
  switch (status) {
    case 'todo': return 'Запланировано';
    case 'in-progress': return 'В процессе';
    case 'done': return 'Готово';
  }
}

const form = document.getElementById('task-form') as HTMLFormElement;
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const titleInput = document.getElementById('task-title') as HTMLInputElement;
  const projectInput = document.getElementById('task-project') as HTMLInputElement;
  const minutesInput = document.getElementById('task-minutes') as HTMLInputElement;
  const deadlineInput = document.getElementById('task-deadline') as HTMLInputElement;

  const title = titleInput.value.trim();
  const project = projectInput.value.trim();
  const plannedMinutes = parseInt(minutesInput.value);
  const deadline = deadlineInput.value;

  if (!title || !project || !deadline || isNaN(plannedMinutes)) {
    alert("Пожалуйста, заполните все поля.");
    return;
  }

  const newTask: Task = {
    id: Date.now().toString(),
    title,
    project,
    plannedMinutes,
    spentMinutes: 0,
    deadline,
    status: 'todo'
  };

  boardData.tasks.push(newTask);
  saveBoard(boardData);
  renderBoard();
  form.reset();
});

if (boardData.tasks.length === 0) {
  boardData.tasks.push({
    id: '1',
    title: 'Написать Kanban',
    project: 'FocusBoard',
    plannedMinutes: 90,
    spentMinutes: 0,
    deadline: new Date().toISOString().split('T')[0],
    status: 'todo'
  });
  saveBoard(boardData);
}
renderBoard();

const themeToggle = document.getElementById('theme-toggle')!;
const root = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if (savedTheme) root.setAttribute('data-theme', savedTheme);
themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// Импорт / экспорт
document.getElementById('export-btn')?.addEventListener('click', () => exportBoard());
document.getElementById('import-btn')?.addEventListener('click', () => {
  const input = document.getElementById('import-input') as HTMLInputElement;
  input.click();
});
document.getElementById('import-input')?.addEventListener('change', () => {
  const file = (document.getElementById('import-input') as HTMLInputElement).files?.[0];
  if (!file) return;
  importBoard(file)
    .then(() => {
      alert('Импорт завершён.');
      renderBoard();
    })
    .catch(() => alert('Ошибка при импорте.'));
});

// Аналитика и переключатели
const analyticsBtn = document.getElementById("analytics-btn") as HTMLButtonElement;
const kanbanBtn = document.getElementById("kanban-btn") as HTMLButtonElement;
const taskForm = document.getElementById("task-form") as HTMLElement;
const analyticsContainer = document.getElementById("analytics") as HTMLElement;
const sectionTasksSection = document.getElementById("section-tasks")!;
const boardSection = document.getElementById("board")!;

analyticsBtn.addEventListener("click", () => {
  boardSection.style.display = "none";
  analyticsContainer.style.display = "flex";
  sectionTasksSection.style.display = "none";
  taskForm.style.display = "none";
  renderAnalytics(boardData);
});
kanbanBtn.addEventListener("click", () => {
  boardSection.style.display = "flex";
  analyticsContainer.style.display = "none";
  sectionTasksSection.style.display = "none";
  taskForm.style.display = "flex";
  renderBoard();
});

// ⬅️ [НОВОЕ] Отрисовка разделов по приоритету
document.querySelectorAll('.section-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = (btn as HTMLButtonElement).dataset.section!;
    boardSection.style.display = 'none';
    analyticsContainer.style.display = 'none';
    taskForm.style.display = 'none';
    sectionTasksSection.style.display = 'block';
    renderSectionTasks(section);
  });
});

function renderSectionTasks(section: string) {
  updateTaskPriorities(boardData.tasks); // ⬅️ [НОВОЕ]
  const filtered = boardData.tasks.filter(task => task.priority === section);
  sectionTasksSection.innerHTML = `
    <h2 class="section-title">${getSectionTitle(section)}</h2>
    <button id="back-to-board" class="btn" style="margin-bottom:20px;">← Назад к доске</button>
    ${filtered.map(renderTaskCardHTML).join('') || '<p>Нет задач в этом разделе.</p>'}
  `;
  document.getElementById('back-to-board')?.addEventListener('click', () => {
    sectionTasksSection.style.display = 'none';
    boardSection.style.display = 'flex';
    taskForm.style.display = 'flex';
    renderBoard();
  });
}

function getSectionTitle(section: string): string {
  switch (section) {
    case 'urgent': return '⚡ Срочные задачи';
    case 'secondary': return '📌 Второстепенные задачи';
    case 'postpone': return '🕒 Перенести на потом';
    default: return '';
  }
}

function renderTaskCardHTML(task: Task): string {
  return `
    <div class="task-card">
      <strong>${task.title}</strong>
      <span>Проект: ${task.project}</span>
      <span>Минут: ${task.plannedMinutes}</span>
      <span>Дедлайн: ${task.deadline}</span>
    </div>
  `;
}

// PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ Service Worker зарегистрирован:', reg.scope))
      .catch(err => console.error('❌ Ошибка регистрации SW:', err));
  });
}
