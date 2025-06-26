import { reactive, computed } from 'vue';
import type { Task, SubTask, TaskStore } from '../types';
// import type { Task, SubTask, TaskStore } from 'src/types';

// Инициальные данные для разработки программного обеспечения
const initialTasks: Task[] = [
    {
        id: '1',
        name: 'Анализ требований',
        startDate: '2024-01-01',
        endDate: '2024-01-15'
    },
    {
        id: '2',
        name: 'Проектирование системы',
        startDate: '2024-01-16',
        endDate: '2024-02-15'
    },
    {
        id: '3',
        name: 'Разработка',
        startDate: '2024-02-16',
        endDate: '2024-04-30'
    },
    {
        id: '4',
        name: 'Тестирование',
        startDate: '2024-05-01',
        endDate: '2024-05-31'
    },
    {
        id: '5',
        name: 'Развертывание',
        startDate: '2024-06-01',
        endDate: '2024-06-15'
    }
];

const initialSubTasks: SubTask[] = [
    // Подзадачи для "Анализ требований"
    {
        id: '1-1',
        taskId: '1',
        name: 'Сбор бизнес-требований',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        progress: 100
    },
    {
        id: '1-2',
        taskId: '1',
        name: 'Анализ конкурентов',
        startDate: '2024-01-06',
        endDate: '2024-01-08',
        progress: 100
    },
    {
        id: '1-3',
        taskId: '1',
        name: 'Создание пользовательских историй',
        startDate: '2024-01-09',
        endDate: '2024-01-12',
        progress: 90
    },
    {
        id: '1-4',
        taskId: '1',
        name: 'Техническое задание',
        startDate: '2024-01-13',
        endDate: '2024-01-14',
        progress: 80
    },
    {
        id: '1-5',
        taskId: '1',
        name: 'Утверждение требований',
        startDate: '2024-01-15',
        endDate: '2024-01-15',
        progress: 70
    },

    // Подзадачи для "Проектирование системы"
    {
        id: '2-1',
        taskId: '2',
        name: 'Архитектура системы',
        startDate: '2024-01-16',
        endDate: '2024-01-25',
        progress: 85
    },
    {
        id: '2-2',
        taskId: '2',
        name: 'Дизайн базы данных',
        startDate: '2024-01-26',
        endDate: '2024-02-02',
        progress: 75
    },
    {
        id: '2-3',
        taskId: '2',
        name: 'UI/UX дизайн',
        startDate: '2024-02-03',
        endDate: '2024-02-10',
        progress: 60
    },
    {
        id: '2-4',
        taskId: '2',
        name: 'API спецификация',
        startDate: '2024-02-11',
        endDate: '2024-02-13',
        progress: 40
    },
    {
        id: '2-5',
        taskId: '2',
        name: 'Техническая документация',
        startDate: '2024-02-14',
        endDate: '2024-02-15',
        progress: 30
    },

    // Подзадачи для "Разработка"
    {
        id: '3-1',
        taskId: '3',
        name: 'Настройка среды разработки',
        startDate: '2024-02-16',
        endDate: '2024-02-20',
        progress: 100
    },
    {
        id: '3-2',
        taskId: '3',
        name: 'Разработка backend',
        startDate: '2024-02-21',
        endDate: '2024-03-31',
        progress: 65
    },
    {
        id: '3-3',
        taskId: '3',
        name: 'Разработка frontend',
        startDate: '2024-03-01',
        endDate: '2024-04-15',
        progress: 45
    },
    {
        id: '3-4',
        taskId: '3',
        name: 'Интеграция компонентов',
        startDate: '2024-04-16',
        endDate: '2024-04-25',
        progress: 20
    },
    {
        id: '3-5',
        taskId: '3',
        name: 'Оптимизация производительности',
        startDate: '2024-04-26',
        endDate: '2024-04-30',
        progress: 10
    },

    // Подзадачи для "Тестирование"
    {
        id: '4-1',
        taskId: '4',
        name: 'Модульное тестирование',
        startDate: '2024-05-01',
        endDate: '2024-05-10',
        progress: 0
    },
    {
        id: '4-2',
        taskId: '4',
        name: 'Интеграционное тестирование',
        startDate: '2024-05-11',
        endDate: '2024-05-18',
        progress: 0
    },
    {
        id: '4-3',
        taskId: '4',
        name: 'Системное тестирование',
        startDate: '2024-05-19',
        endDate: '2024-05-25',
        progress: 0
    },
    {
        id: '4-4',
        taskId: '4',
        name: 'Пользовательское тестирование',
        startDate: '2024-05-26',
        endDate: '2024-05-29',
        progress: 0
    },
    {
        id: '4-5',
        taskId: '4',
        name: 'Отчет о тестировании',
        startDate: '2024-05-30',
        endDate: '2024-05-31',
        progress: 0
    },

    // Подзадачи для "Развертывание"
    {
        id: '5-1',
        taskId: '5',
        name: 'Подготовка продакшн среды',
        startDate: '2024-06-01',
        endDate: '2024-06-05',
        progress: 0
    },
    {
        id: '5-2',
        taskId: '5',
        name: 'Миграция данных',
        startDate: '2024-06-06',
        endDate: '2024-06-08',
        progress: 0
    },
    {
        id: '5-3',
        taskId: '5',
        name: 'Развертывание приложения',
        startDate: '2024-06-09',
        endDate: '2024-06-10',
        progress: 0
    },
    {
        id: '5-4',
        taskId: '5',
        name: 'Мониторинг и отладка',
        startDate: '2024-06-11',
        endDate: '2024-06-13',
        progress: 0
    },
    {
        id: '5-5',
        taskId: '5',
        name: 'Передача проекта',
        startDate: '2024-06-14',
        endDate: '2024-06-15',
        progress: 0
    }
];

const store = reactive<TaskStore>({
    tasks: [...initialTasks],
    subTasks: [...initialSubTasks],
    selectedTaskId: null
});

export function useTaskStore() {
    const selectedTask = computed(() =>
        store.tasks.find(task => task.id === store.selectedTaskId) || null
    );

    const selectedSubTasks = computed(() =>
        store.subTasks.filter(subTask => subTask.taskId === store.selectedTaskId)
    );

    const addTask = (task: Omit<Task, 'id'>) => {
        const newTask: Task = {
            ...task,
            id: Date.now().toString()
        };
        store.tasks.push(newTask);
        saveToStorage();
    };

    const addSubTask = (subTask: Omit<SubTask, 'id'>) => {
        const newSubTask: SubTask = {
            ...subTask,
            id: `${subTask.taskId}-${Date.now()}`
        };
        store.subTasks.push(newSubTask);
        saveToStorage();
    };

    const selectTask = (taskId: string | null) => {
        store.selectedTaskId = taskId;
    };

    const saveToStorage = () => {
        localStorage.setItem('diaganzer-data', JSON.stringify({
            tasks: store.tasks,
            subTasks: store.subTasks
        }));
    };

    const loadFromStorage = () => {
        const saved = localStorage.getItem('diaganzer-data');
        if (saved) {
            const data = JSON.parse(saved);
            store.tasks = data.tasks || [];
            store.subTasks = data.subTasks || [];
        }
    };

    // Загружаем данные при инициализации
    loadFromStorage();

    return {
        tasks: computed(() => store.tasks),
        subTasks: computed(() => store.subTasks),
        selectedTaskId: computed(() => store.selectedTaskId),
        selectedTask,
        selectedSubTasks,
        addTask,
        addSubTask,
        selectTask,
        saveToStorage
    };
}