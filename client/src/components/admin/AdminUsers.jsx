import { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      if (data && data.data) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/admin/users/${id}`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user', error);
      }
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.put(`/admin/users/${id}`, { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error('Error updating role', error);
    }
  };

  return (
    <div className="history-table-wrapper">
      <h2>Manage Users</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <select 
                  value={user.role} 
                  onChange={(e) => handleRoleChange(user._id, e.target.value)}
                  style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', background: '#fff', color: '#333', border: '1px solid #ccc' }}
                >
                  <option value="user" style={{ color: '#333', background: '#fff' }}>User</option>
                  <option value="admin" style={{ color: '#333', background: '#fff' }}>Admin</option>
                </select>
              </td>
              <td>
                <button className="btn btn-sell" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleDelete(user._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;
