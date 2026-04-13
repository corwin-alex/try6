import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = '/api';

function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState({});
  const [notes, setNotes] = useState({});
  const [newModule, setNewModule] = useState({ title: '', order_index: 0 });
  const [newLesson, setNewLesson] = useState({ moduleId: '', title: '', content: '', order_index: 0 });
  const [newNote, setNewNote] = useState({ lessonId: '', content: '' });
  const [expandedModule, setExpandedModule] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      const courseResponse = await fetch(`${API_URL}/courses`);
      const courses = await courseResponse.json();
      const currentCourse = courses.find(c => c.id === parseInt(id));
      setCourse(currentCourse);

      const modulesResponse = await fetch(`${API_URL}/courses/${id}/modules`);
      const modulesData = await modulesResponse.json();
      setModules(modulesData);

      // Загружаем уроки для каждого модуля
      const lessonsData = {};
      const notesData = {};
      for (const module of modulesData) {
        const lessonsResponse = await fetch(`${API_URL}/modules/${module.id}/lessons`);
        const lessonsList = await lessonsResponse.json();
        lessonsData[module.id] = lessonsList;

        // Загружаем заметки для каждого урока
        for (const lesson of lessonsList) {
          const notesResponse = await fetch(`${API_URL}/lessons/${lesson.id}/notes`);
          const notesList = await notesResponse.json();
          notesData[lesson.id] = notesList;
        }
      }
      setLessons(lessonsData);
      setNotes(notesData);
    } catch (error) {
      console.error('Ошибка загрузки данных курса:', error);
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModule.title.trim()) return;

    try {
      const response = await fetch(`${API_URL}/courses/${id}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newModule,
          order_index: modules.length
        })
      });
      const data = await response.json();
      setModules([...modules, data]);
      setNewModule({ title: '', order_index: 0 });
    } catch (error) {
      console.error('Ошибка создания модуля:', error);
    }
  };

  const handleAddLesson = async (e, moduleId) => {
    e.preventDefault();
    if (!newLesson.title.trim() || newLesson.moduleId !== moduleId.toString()) return;

    const moduleLessons = lessons[moduleId] || [];
    try {
      const response = await fetch(`${API_URL}/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newLesson.title,
          content: newLesson.content,
          order_index: moduleLessons.length
        })
      });
      const data = await response.json();
      setLessons({
        ...lessons,
        [moduleId]: [...moduleLessons, data]
      });
      setNewLesson({ moduleId: '', title: '', content: '', order_index: 0 });
    } catch (error) {
      console.error('Ошибка создания урока:', error);
    }
  };

  const handleToggleLesson = async (lessonId, moduleId) => {
    try {
      const response = await fetch(`${API_URL}/lessons/${lessonId}/toggle`, {
        method: 'PUT'
      });
      const data = await response.json();
      
      const updatedLessons = lessons[moduleId].map(l =>
        l.id === lessonId ? data : l
      );
      setLessons({
        ...lessons,
        [moduleId]: updatedLessons
      });
    } catch (error) {
      console.error('Ошибка обновления урока:', error);
    }
  };

  const handleAddNote = async (e, lessonId) => {
    e.preventDefault();
    if (!newNote.content.trim() || newNote.lessonId !== lessonId.toString()) return;

    try {
      const response = await fetch(`${API_URL}/lessons/${lessonId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.content })
      });
      const data = await response.json();
      
      setNotes({
        ...notes,
        [lessonId]: [data, ...(notes[lessonId] || [])]
      });
      setNewNote({ lessonId: '', content: '' });
    } catch (error) {
      console.error('Ошибка создания заметки:', error);
    }
  };

  const calculateProgress = () => {
    let totalLessons = 0;
    let completedLessons = 0;

    Object.values(lessons).forEach(moduleLessons => {
      totalLessons += moduleLessons.length;
      completedLessons += moduleLessons.filter(l => l.is_completed).length;
    });

    return totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
  };

  if (!course) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="container">
      <button onClick={() => navigate('/')} className="btn btn-secondary back-btn">
        ← Назад к списку курсов
      </button>

      <div className="card">
        <h2>{course.title}</h2>
        <p>{course.description}</p>
        
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${calculateProgress()}%` }}>
            Прогресс: {calculateProgress()}%
          </div>
        </div>
      </div>

      {/* Добавление модуля */}
      <div className="card">
        <h3>➕ Добавить модуль</h3>
        <form onSubmit={handleAddModule}>
          <div className="form-group">
            <label>Название модуля</label>
            <input
              type="text"
              value={newModule.title}
              onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
              placeholder="Введите название модуля"
              required
            />
          </div>
          <button type="submit" className="btn">Добавить модуль</button>
        </form>
      </div>

      {/* Список модулей */}
      {modules.map(module => (
        <div key={module.id} className="card">
          <div className="lesson-header">
            <h3>📁 Модуль {module.order_index + 1}: {module.title}</h3>
            <button
              onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
              className="btn btn-secondary"
            >
              {expandedModule === module.id ? 'Свернуть' : 'Развернуть'}
            </button>
          </div>

          {expandedModule === module.id && (
            <>
              {/* Добавление урока */}
              <form onSubmit={(e) => handleAddLesson(e, module.id)} style={{ marginTop: '15px' }}>
                <div className="form-group">
                  <label>Название урока</label>
                  <input
                    type="text"
                    value={newLesson.moduleId === module.id.toString() ? newLesson.title : ''}
                    onChange={(e) => setNewLesson({ 
                      ...newLesson, 
                      moduleId: module.id.toString(),
                      title: e.target.value 
                    })}
                    placeholder="Введите название урока"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Содержание урока</label>
                  <textarea
                    value={newLesson.moduleId === module.id.toString() ? newLesson.content : ''}
                    onChange={(e) => setNewLesson({ 
                      ...newLesson, 
                      moduleId: module.id.toString(),
                      content: e.target.value 
                    })}
                    placeholder="Введите содержание урока"
                  />
                </div>
                <button type="submit" className="btn">Добавить урок</button>
              </form>

              {/* Список уроков */}
              {(lessons[module.id] || []).map(lesson => (
                <div
                  key={lesson.id}
                  className={`lesson-item ${lesson.is_completed ? 'completed' : ''}`}
                  style={{ marginTop: '15px' }}
                >
                  <div className="lesson-header">
                    <h4>
                      {lesson.is_completed ? '✅' : '⬜'} Урок {lesson.order_index + 1}: {lesson.title}
                    </h4>
                    <button
                      onClick={() => handleToggleLesson(lesson.id, module.id)}
                      className={`btn ${lesson.is_completed ? 'btn-secondary' : 'btn-success'}`}
                    >
                      {lesson.is_completed ? 'Отметить как непройденный' : 'Пройдено'}
                    </button>
                  </div>

                  {lesson.content && <p>{lesson.content}</p>}

                  {/* Заметки */}
                  <div className="notes-section">
                    <h5>📝 Заметки</h5>
                    
                    <form onSubmit={(e) => handleAddNote(e, lesson.id)} style={{ marginBottom: '10px' }}>
                      <div className="form-group">
                        <textarea
                          value={newNote.lessonId === lesson.id.toString() ? newNote.content : ''}
                          onChange={(e) => setNewNote({ 
                            lessonId: lesson.id.toString(),
                            content: e.target.value 
                          })}
                          placeholder="Добавить заметку"
                          style={{ minHeight: '60px' }}
                        />
                      </div>
                      <button type="submit" className="btn btn-secondary">Добавить заметку</button>
                    </form>

                    {(notes[lesson.id] || []).map(note => (
                      <div key={note.id} className="note-item">
                        <small>{new Date(note.created_at).toLocaleDateString('ru-RU')}</small>
                        <p>{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default CourseDetailPage;
