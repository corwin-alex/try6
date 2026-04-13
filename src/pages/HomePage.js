import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

function HomePage() {
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ title: '', description: '' });
  const [stats, setStats] = useState({ totalCourses: 0, totalLessons: 0, completedLessons: 0 });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [courses]);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/courses`);
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Ошибка загрузки курсов:', error);
    }
  };

  const calculateStats = async () => {
    let totalLessons = 0;
    let completedLessons = 0;

    for (const course of courses) {
      try {
        const modulesResponse = await fetch(`${API_URL}/courses/${course.id}/modules`);
        const modules = await modulesResponse.json();

        for (const module of modules) {
          const lessonsResponse = await fetch(`${API_URL}/modules/${module.id}/lessons`);
          const lessons = await lessonsResponse.json();
          totalLessons += lessons.length;
          completedLessons += lessons.filter(l => l.is_completed).length;
        }
      } catch (error) {
        console.error('Ошибка получения статистики:', error);
      }
    }

    setStats({
      totalCourses: courses.length,
      totalLessons,
      completedLessons
    });
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.title.trim()) return;

    try {
      const response = await fetch(`${API_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse)
      });
      const data = await response.json();
      setCourses([data, ...courses]);
      setNewCourse({ title: '', description: '' });
    } catch (error) {
      console.error('Ошибка создания курса:', error);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот курс?')) return;

    try {
      await fetch(`${API_URL}/courses/${id}`, { method: 'DELETE' });
      setCourses(courses.filter(c => c.id !== id));
    } catch (error) {
      console.error('Ошибка удаления курса:', error);
    }
  };

  const calculateCourseProgress = async (courseId) => {
    try {
      const modulesResponse = await fetch(`${API_URL}/courses/${courseId}/modules`);
      const modules = await modulesResponse.json();

      let totalLessons = 0;
      let completedLessons = 0;

      for (const module of modules) {
        const lessonsResponse = await fetch(`${API_URL}/modules/${module.id}/lessons`);
        const lessons = await lessonsResponse.json();
        totalLessons += lessons.length;
        completedLessons += lessons.filter(l => l.is_completed).length;
      }

      return totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
    } catch (error) {
      console.error('Ошибка расчёта прогресса:', error);
      return 0;
    }
  };

  return (
    <div className="container">
      {/* Статистика */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-number">{stats.totalCourses}</div>
          <div className="stat-label">Всего курсов</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalLessons}</div>
          <div className="stat-label">Всего уроков</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.completedLessons}</div>
          <div className="stat-label">Пройдено уроков</div>
        </div>
      </div>

      {/* Форма добавления курса */}
      <div className="card">
        <h2>➕ Добавить новый курс</h2>
        <form onSubmit={handleAddCourse}>
          <div className="form-group">
            <label>Название курса</label>
            <input
              type="text"
              value={newCourse.title}
              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              placeholder="Введите название курса"
              required
            />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              placeholder="Введите описание курса"
            />
          </div>
          <button type="submit" className="btn">Добавить курс</button>
        </form>
      </div>

      {/* Список курсов */}
      <div className="card">
        <h2>📋 Мои курсы</h2>
        {courses.length === 0 ? (
          <p>У вас пока нет курсов. Добавьте первый курс!</p>
        ) : (
          <ul className="course-list">
            {courses.map(course => (
              <CourseItem
                key={course.id}
                course={course}
                onDelete={handleDeleteCourse}
                calculateProgress={calculateCourseProgress}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CourseItem({ course, onDelete, calculateProgress }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    calculateProgress(course.id).then(setProgress);
  }, [course.id]);

  return (
    <li className="course-item">
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}>
          {progress}%
        </div>
      </div>

      <div className="actions">
        <Link to={`/course/${course.id}`} className="btn">Открыть курс</Link>
        <button onClick={() => onDelete(course.id)} className="btn btn-danger">
          Удалить
        </button>
      </div>
    </li>
  );
}

export default HomePage;
