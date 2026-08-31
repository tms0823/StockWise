import { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [cueCards, setCueCards] = useState([]);
  const [formData, setFormData] = useState({
    topic: '',
    question: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    explanation: '',
  });

  const fetchQuizzes = async () => {
    try {
      const { data } = await api.get('/admin/quizzes');
      if (data && data.data) {
        setQuizzes(data.data);
      }
    } catch (error) {
      console.error('Error fetching quiz questions', error);
    }
  };

  const fetchCueCards = async () => {
    try {
      const { data } = await api.get('/cue-cards');
      if (data && data.data) {
        setCueCards(data.data);
        if (data.data.length > 0 && !formData.topic) {
          setFormData(prev => ({ ...prev, topic: data.data[0].topic }));
        }
      }
    } catch (error) {
      console.error('Error fetching cue cards', error);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchCueCards();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this quiz question?')) {
      try {
        await api.delete(`/admin/quizzes/${id}`);
        fetchQuizzes();
      } catch (error) {
        console.error('Error deleting quiz question', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Filter out any empty option strings
      const filteredOptions = formData.options.filter(opt => opt.trim() !== '');
      if (filteredOptions.length < 2) {
        alert('Please enter at least 2 options.');
        return;
      }

      const postData = {
        ...formData,
        options: filteredOptions,
        correctOptionIndex: Number(formData.correctOptionIndex)
      };

      await api.post('/admin/quizzes', postData);
      setFormData({
        topic: cueCards[0]?.topic || '',
        question: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        explanation: '',
      });
      fetchQuizzes();
      alert('Quiz question added successfully!');
    } catch (error) {
      console.error('Error creating quiz question', error);
      alert(error.response?.data?.message || 'Failed to create quiz question.');
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="auth-container" style={{ margin: '0 auto', maxWidth: '600px' }}>
        <h2 style={{ textAlign: 'center' }}>Create Quiz Question</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Topic (Must match a Cue Card topic exactly)</label>
            <select
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              required
              style={{ padding: '0.6rem 0.75rem', borderRadius: '6px', background: '#fff', color: '#333', border: '1px solid #ccc', fontSize: '1rem' }}
            >
              <option value="">Select Topic</option>
              {cueCards.map(c => (
                <option key={c._id} value={c.topic} style={{ color: '#333', background: '#fff' }}>{c.topic}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Question Text</label>
            <textarea
              rows="3"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', background: '#fff', color: '#333', border: '1px solid #ccc', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label>Options (Enter 2 to 4 options)</label>
            {formData.options.map((option, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ minWidth: '80px', fontSize: '0.85rem' }}>Option {idx + 1}:</span>
                <input
                  type="text"
                  value={option}
                  placeholder={`Option ${idx + 1}`}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  required={idx < 2}
                  style={{ flex: 1, padding: '0.6rem 0.75rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '1rem', color: '#333', background: '#fff' }}
                />
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>Correct Option Index (0 to 3)</label>
            <select
              value={formData.correctOptionIndex}
              onChange={(e) => setFormData({ ...formData, correctOptionIndex: e.target.value })}
              required
              style={{ padding: '0.6rem 0.75rem', borderRadius: '6px', background: '#fff', color: '#333', border: '1px solid #ccc', fontSize: '1rem' }}
            >
              {formData.options.map((_, idx) => (
                <option key={idx} value={idx} style={{ color: '#333', background: '#fff' }}>Option {idx + 1}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Explanation (Optional)</label>
            <input
              type="text"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              style={{ padding: '0.6rem 0.75rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '1rem', color: '#333', background: '#fff' }}
            />
          </div>

          <button type="submit" className="btn">Add Quiz Question</button>
        </form>
      </div>

      <div className="history-table-wrapper">
        <h2>Existing Quiz Questions ({quizzes.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Topic</th>
              <th>Question</th>
              <th>Options</th>
              <th>Correct Answer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((quiz) => (
              <tr key={quiz._id}>
                <td><strong>{quiz.topic}</strong></td>
                <td style={{ maxWidth: '250px' }}>{quiz.question}</td>
                <td>
                  <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem' }}>
                    {quiz.options.map((opt, oIdx) => (
                      <li key={oIdx} style={{ fontWeight: oIdx === quiz.correctOptionIndex ? 'bold' : 'normal' }}>
                        {opt} {oIdx === quiz.correctOptionIndex && ' ✓'}
                      </li>
                    ))}
                  </ol>
                </td>
                <td>Option {quiz.correctOptionIndex + 1}</td>
                <td>
                  <button className="btn btn-sell" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleDelete(quiz._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminQuizzes;
