import { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminCueCards = () => {
  const [cueCards, setCueCards] = useState([]);
  const [formData, setFormData] = useState({ topic: '', definition: '', example: '', displayOrder: 1 });

  const fetchCueCards = async () => {
    try {
      const { data } = await api.get('/cue-cards');
      if (data && data.data) {
        setCueCards(data.data);
      }
    } catch (error) {
      console.error('Error fetching cue cards', error);
    }
  };

  useEffect(() => {
    fetchCueCards();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this cue card?')) {
      try {
        await api.delete(`/cue-cards/${id}`);
        fetchCueCards();
      } catch (error) {
        console.error('Error deleting cue card', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cue-cards', formData);
      setFormData({ topic: '', definition: '', example: '', displayOrder: cueCards.length + 2 });
      fetchCueCards();
      alert('Cue Card added successfully!');
    } catch (error) {
      console.error('Error creating cue card', error);
      alert(error.response?.data?.message || 'Failed to create cue card.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="auth-container" style={{ margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center' }}>Create Cue Card</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Topic</label>
            <input type="text" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Definition</label>
            <input type="text" value={formData.definition} onChange={(e) => setFormData({...formData, definition: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Example (Optional)</label>
            <input type="text" value={formData.example} onChange={(e) => setFormData({...formData, example: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Display Order</label>
            <input type="number" value={formData.displayOrder} onChange={(e) => setFormData({...formData, displayOrder: e.target.value})} required />
          </div>
          <button type="submit" className="btn">Add Cue Card</button>
        </form>
      </div>

      <div className="history-table-wrapper">
        <h2>Existing Cue Cards</h2>
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Topic</th>
              <th>Definition</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cueCards.map((card) => (
              <tr key={card._id}>
                <td>{card.displayOrder}</td>
                <td>{card.topic}</td>
                <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.definition}</td>
                <td>
                  <button className="btn btn-sell" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleDelete(card._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCueCards;
