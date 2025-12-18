import { useEffect, useState } from "react";
import { listUsers } from "../api/userApi";
import { useAuth } from "../context/AuthContext";
import "./UserList.css";
import AddUserForm from "../components/AddUserForm";
import { createUser } from "../api/userApi";
import Modal from "../components/Modal";
import EditUserForm from "../components/EditUserForm";
import { updateUser } from "../api/userApi";
import ResetPasswordForm from "../components/ResetPasswordForm";
import { resetUserPassword } from "../api/userApi";
import { unlockUser } from "../api/userApi";





export default function UserList() {
  const { auth } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [success, setSuccess] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [successReset, setSuccessReset] = useState("");




  const isAdmin =
    auth.role === "ADMIN" || auth.role === "SUPER_ADMIN";

  const allowedRoles =
  auth.role === "SUPER_ADMIN"
    ? ["ADMIN", "USER"]
    : ["USER"];


  useEffect(() => {
    if (!isAdmin) return;

    const load = async () => {
      try {
        setLoading(true);
        const data = await listUsers();
        setUsers(data);
      } catch {
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

    const handleAddUser = async (payload) => {
        await createUser(payload);
        setSuccess("User created successfully");
        setShowAdd(false);
        load(); // reload user list
    };

    const handleUpdateUser = async (payload) => {
        await updateUser(editingUser.id, payload);
        setEditingUser(null);
        load(); // reload users
    };

    const handleResetPassword = async (tempPassword) => {
        await resetUserPassword(resetUser.id, tempPassword);
        setResetUser(null);
        setSuccessReset("Password reset successfully");
    };

    const handleUnlockUser = async (user) => {
        const confirm = window.confirm(
            `Unlock user "${user.username}"?`
        );
        if (!confirm) return;

        await unlockUser(user.id);
        setSuccess(`User ${user.username} unlocked`);
        load(); // refresh list
    };



  if (!isAdmin) {
    return <p>You are not authorized to view this page.</p>;
  }

  return (
    <div className="user-page">
      <h2>User Management</h2>

      {error && <div className="alert error">{error}</div>}

      {success && <div className="alert success">{success}</div>}

        <button
        className="primary-btn"
        onClick={() => setShowAdd(true)}
        >
        + Add User
        </button>

        {showAdd && (
        <div style={{ marginTop: 16 }}>
            <AddUserForm
            allowedRoles={allowedRoles}
            onSave={handleAddUser}
            onCancel={() => setShowAdd(false)}
            />
        </div>
        )}


      <div className="user-card">
        {loading ? (
          <p className="status-text">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="status-text">No users found</p>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Role</th>
                <th>Active</th>
                <th>Locked</th>
                <th>Actions</th>

              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => (
                <tr key={u.id}>
                  <td>{index + 1}</td>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td>
                    <span
                      className={
                        u.active ? "status active" : "status inactive"
                      }
                    >
                      {u.active ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        u.accountLocked
                          ? "status locked"
                          : "status unlocked"
                      }
                    >
                      {u.accountLocked ? "Locked" : "No"}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => setEditingUser(u)}>✏️ Edit</button>
                    <button style={{ marginLeft: 6 }} onClick={() => setResetUser(u)} >🔑 Reset Password</button>
                    {auth.role === "SUPER_ADMIN" && u.accountLocked && (
                        <button
                        style={{ marginLeft: 6 }}
                        onClick={() => handleUnlockUser(u)}
                        >
                        🔓 Unlock
                        </button>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {editingUser && (
        <Modal title="Edit User" onClose={() => setEditingUser(null)}>
            <EditUserForm
            user={editingUser}
            onSave={handleUpdateUser}
            onCancel={() => setEditingUser(null)}
            />
        </Modal>
        )}
        {resetUser && (
            <Modal
                title="Reset User Password"
                onClose={() => setResetUser(null)}
            >
                <ResetPasswordForm
                user={resetUser}
                onSave={handleResetPassword}
                onCancel={() => setResetUser(null)}
                />
            </Modal>
            )}


    </div>
  );
}
