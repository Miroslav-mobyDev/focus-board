
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

function createTaskCard(task: Task): HTMLElement {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.draggable = true;
  card.dataset.id = task.id;

  card.innerHTML = `
    <strong>${task.title}</strong><br>
    Проект: ${task.project}<br>
    План: ${task.plannedMinutes} мин<br>
    Выполнено: <span class="spent">${task.spentMinutes}</span> мин<br>
    Срок: ${task.deadline}<br>
    <button class="start-btn">▶ Старт</button>
    <span class="timer-display" style="margin-left: 10px;"></span>
  `;

  const startBtn = card.querySelector('.start-btn') as HTMLButtonElement;
  const timerDisplay = card.querySelector('.timer-display') as HTMLSpanElement;
  
const addBtn = document.createElement('button');
addBtn.textContent = '➕ Добавить минуты';
addBtn.style.marginLeft = '10px';


if (task.status === 'todo') {
  addBtn.style.display = 'none';
}

card.appendChild(addBtn);

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



  const spentSpan = card.querySelector('.spent') as HTMLSpanElement;
  const taskId = task.id;

  // === Если задача завершена ===
  if (task.status === 'done') {
    timerDisplay.textContent = `✅ Выполнено за ${task.spentMinutes} мин`;
    startBtn.remove();
    return card;
  }

  // === Если задача была в процессе и есть startTime ===
  if (task.startTime) {
    const passed = Math.floor((Date.now() - task.startTime) / 1000);
    activeSeconds.set(taskId, passed);
    timerDisplay.textContent = `⏱ ${passed} сек`;
    spentSpan.textContent = task.spentMinutes.toString();
    startTimer(task, spentSpan, timerDisplay);
  }

  // === Старт таймера по кнопке ===
  startBtn.addEventListener('click', () => {
    if (activeTimers.has(taskId)) return;

    if (task.status !== 'in-progress') {
      task.status = 'in-progress';
      saveBoard(boardData);
      renderBoard();
      return;
    }

    startTimer(task, spentSpan, timerDisplay);
  });

  return card;
}

function startTimer(task: Task, spentSpan: HTMLElement, timerDisplay: HTMLElement) {
  const taskId = task.id;
  let seconds = activeSeconds.get(taskId) ?? 0;

  if (!task.startTime) {
    task.startTime = Date.now();
  }

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

  const today = new Date();
  const inputDate = new Date(deadline);

  if (!title || !project || !deadline || isNaN(plannedMinutes)) {
    alert("Пожалуйста, заполните все поля.");
    return;
  }

  if (plannedMinutes <= 0) {
    alert("Количество минут должно быть больше 0.");
    return;
  }

  if (inputDate < today) {
    alert("Дата дедлайна не может быть в прошлом.");
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

// Автоматическая задача для первого запуска
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

// Загружаем тему из localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  root.setAttribute('data-theme', savedTheme);
}

// Переключение темы
themeToggle.addEventListener('click', () => {
  const current = root.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

const exportBtn = document.getElementById('export-btn')!;
const importBtn = document.getElementById('import-btn')!;
const importInput = document.getElementById('import-input') as HTMLInputElement;

exportBtn.addEventListener('click', () => {
  exportBoard(); 
});

importBtn.addEventListener('click', () => {
  importInput.click();
});

importInput.addEventListener('change', () => {
  const file = importInput.files?.[0];
  if (!file) return;

  importBoard(file)
    .then(() => {
      alert('Импорт завершён успешно. Страница будет перезагружена.');
    })
    .catch(() => {
      alert('Ошибка при импорте. Убедитесь, что файл корректен.');
    });
});

const boardContainer = document.getElementById('board')!;
const analyticsContainer = document.getElementById('analytics')!;

document.getElementById('kanban-btn')?.addEventListener('click', () => {
  boardContainer.style.display = 'block';
  analyticsContainer.style.display = 'none';
});

document.getElementById('analytics-btn')?.addEventListener('click', () => {
  boardContainer.style.display = 'none';
  analyticsContainer.style.display = 'block';
  renderAnalytics(boardData);
});