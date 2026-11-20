const express = require('express');
const path = require('path');
const Joi = require('joi');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let tasks = [
  { id: 1, title: 'Вивчити Joi', completed: false },
  { id: 2, title: 'Підключити Notyf', completed: false }
];
let nextId = 3;

const taskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required().messages({
    'string.base': 'Поле title має бути рядком',
    'string.empty': 'Назва задачі не може бути порожньою',
    'string.min': 'Назва задачі має містити щонайменше {#limit} символи',
    'string.max': 'Назва задачі має містити не більше {#limit} символів',
    'any.required': 'Поле title є обов\'язковим'
  })
});

const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).messages({
    'string.empty': 'Назва задачі не може бути порожньою',
    'string.min': 'Назва задачі має містити щонайменше {#limit} символи',
    'string.max': 'Назва задачі має містити не більше {#limit} символів'
  }),
  completed: Joi.boolean().messages({
    'boolean.base': 'Поле completed має бути true або false'
  })
}).or('title', 'completed').messages({
  'object.missing': 'Потрібно передати title або completed'
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { convert: true });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  req.body = value;
  next();
};

app.get('/', (req, res) => {
  res.render('tasks', { title: 'Список справ', tasks });
});

app.get('/api/tasks', (req, res) => {
  res.status(200).json({ success: true, message: 'Список задач отримано', data: tasks });
});

app.post('/api/tasks', validate(taskSchema), (req, res) => {
  const task = { id: nextId++, title: req.body.title, completed: false };
  tasks.push(task);
  res.status(201).json({ success: true, message: 'Задачу успішно створено', data: task });
});

app.put('/api/tasks/:id', validate(updateTaskSchema), (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id));
  if (!task) {
    return res.status(404).json({ success: false, message: 'Задачу не знайдено' });
  }
  Object.assign(task, req.body);
  res.status(200).json({ success: true, message: 'Задачу успішно оновлено', data: task });
});

app.delete('/api/tasks/:id', (req, res) => {
  const index = tasks.findIndex((t) => t.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Задачу не знайдено' });
  }
  tasks.splice(index, 1);
  res.status(200).json({ success: true, message: 'Задачу успішно видалено' });
});

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Маршрут не знайдено' });
});

app.listen(PORT, () => console.log(`Сервер запущено: http://localhost:${PORT}`));
