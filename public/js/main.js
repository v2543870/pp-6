// Ініціалізація Notyf
const notyf = new Notyf({
  duration: 3500,
  position: { x: 'right', y: 'top' },
  dismissible: true,
  types: [
    { type: 'success', background: '#2e9e4f' },
    { type: 'error', background: '#d93025', duration: 5000 }
  ]
});

const form = document.getElementById('task-form');
const input = document.getElementById('title');
const list = document.getElementById('task-list');

// Універсальна функція запиту: показує сповіщення за статусом відповіді
async function apiRequest(url, method, body) {
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const result = await response.json();

    if (response.status === 200 || response.status === 201) {
      notyf.success(result.message);
    } else if (response.status === 400 || response.status === 404) {
      notyf.error(result.message);
    } else {
      notyf.error(result.message || 'Невідома помилка сервера');
    }
    return { ok: response.ok, result };
  } catch (err) {
    notyf.error('Не вдалося з\'єднатися із сервером');
    return { ok: false };
  }
}

// Створення DOM-елемента задачі
function createTaskElement(task) {
  const li = document.createElement('li');
  li.dataset.id = task.id;
  if (task.completed) li.classList.add('done');

  const span = document.createElement('span');
  span.className = 'title';
  span.textContent = task.title;

  const actions = document.createElement('div');
  actions.className = 'actions';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'toggle-btn';
  toggle.textContent = task.completed ? 'Відновити' : 'Виконано';

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete-btn';
  del.textContent = 'Видалити';

  actions.append(toggle, del);
  li.append(span, actions);
  return li;
}

// Додавання задачі
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { ok, result } = await apiRequest('/api/tasks', 'POST', { title: input.value });
  if (ok) {
    list.appendChild(createTaskElement(result.data));
    form.reset();
    input.focus();
  }
});

// Оновлення / видалення (делегування подій)
list.addEventListener('click', async (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.classList.contains('toggle-btn')) {
    const completed = !li.classList.contains('done');
    const { ok } = await apiRequest(`/api/tasks/${id}`, 'PUT', { completed });
    if (ok) {
      li.classList.toggle('done', completed);
      e.target.textContent = completed ? 'Відновити' : 'Виконано';
    }
  }

  if (e.target.classList.contains('delete-btn')) {
    const { ok } = await apiRequest(`/api/tasks/${id}`, 'DELETE');
    if (ok) li.remove();
  }
});
