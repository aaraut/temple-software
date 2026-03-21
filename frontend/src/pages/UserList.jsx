import { useEffect, useState } from "react";
import { listUsers, createUser, updateUser, resetUserPassword, unlockUser } from "../api/userApi";
import { useAuth } from "../context/AuthContext";
import "./UserList.css";
import AddUserForm from "../components/AddUserForm";
import Modal from "../components/Modal";
import EditUserForm from "../components/EditUserForm";
import ResetPasswordForm from "../components/ResetPasswordForm";

const L = {
  en: {
    title: "User Management",
    addBtn: "+ Add User",
    loading: "Loading users...",
    noUsers: "No users found",
    unauthorized: "You are not authorized to view this page.",
    colNo: "#",
    colUsername: "Username",
    colRole: "Role",
    colActive: "Active",
    colLocked: "Locked",
    colActions: "Actions",
    yes: "Yes",
    no: "No",
    locked: "Locked",
    editBtn: "✏️ Edit",
    resetBtn: "🔑 Reset Password",
    unlockBtn: "🔓 Unlock",
    modalEdit: "Edit User",
    modalReset: "Reset User Password",
    successCreated: "यूज़र सफलतापूर्वक बनाया गया",
    unlockConfirm: (u) => `Unlock user "${u}"?`,
    unlockSuccess: (u) => `User ${u} unlocked`,
    errorLoad: "Failed to load users",
  },
  hi: {
    title: "यूज़र प्रबंधन",
    addBtn: "+ यूज़र जोड़ें",
    loading: "यूज़र लोड हो रहे हैं...",
    noUsers: "कोई यूज़र नहीं मिला",
    unauthorized: "आप इस पृष्ठ को देखने के लिए अधिकृत नहीं हैं।",
    colNo: "#",
    colUsername: "यूज़रनेम",
    colRole: "भूमिका",
    colActive: "सक्रिय",
    colLocked: "लॉक्ड",
    colActions: "कार्य",
    yes: "हाँ",
    no: "नहीं",
    locked: "लॉक्ड",
    editBtn: "✏️ एडिट",
    resetBtn: "🔑 पासवर्ड रीसेट",
    unlockBtn: "🔓 अनलॉक",
    modalEdit: "यूज़र एडिट करें",
    modalReset: "यूज़र पासवर्ड रीसेट करें",
    successCreated: "यूज़र सफलतापूर्वक बनाया गया",
    unlockConfirm: (u) => `यूज़र "${u}" को अनलॉक करें?`,
    unlockSuccess: (u) => `यूज़र ${u} अनलॉक किया गया`,
    errorLoad: "यूज़र लोड करने में विफल",
  },
};

export default function UserList() {
  const { auth, language } = useAuth();
  const t = L[language] ?? L.en;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [success, setSuccess] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [successReset, setSuccessReset] = useState("");

  const isAdmin = auth.role === "ADMIN" || auth.role === "SUPER_ADMIN";
  const allowedRoles = auth.role === "SUPER_ADMIN" ? ["ADMIN", "USER"] : ["USER"];

  const load = async () => {
    try {
      setLoading(true);
      const data = await listUsers();
      setUsers(data);
    } catch {
      setError(t.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) load(); }, []);

  const handleAddUser = async (payload) => {
    await createUser(payload);
    setSuccess(t.successCreated);
    setShowAdd(false);
    load();
  };

  const handleUpdateUser = async (payload) => {
    await updateUser(editingUser.id, payload);
    setEditingUser(null);
    load();
  };

  const handleResetPassword = async (tempPassword) => {
    await resetUserPassword(resetUser.id, tempPassword);
    setResetUser(null);
    setSuccessReset(language === "hi" ? "पासवर्ड सफलतापूर्वक रीसेट हुआ" : "Password reset successfully");
  };

  const handleUnlockUser = async (user) => {
    const ok = window.confirm(t.unlockConfirm(user.username));
    if (!ok) return;
    await unlockUser(user.id);
    setSuccess(t.unlockSuccess(user.username));
    load();
  };

  if (!isAdmin) return <p>{t.unauthorized}</p>;

  return (
    <div className="user-page">
      <h2>{t.title}</h2>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}
      {successReset && <div className="alert success">{successReset}</div>}

      <button className="primary-btn" onClick={() => setShowAdd(true)}>
        {t.addBtn}
      </button>

      {showAdd && (
        <div style={{ marginTop: 16 }}>
          <AddUserForm
            allowedRoles={allowedRoles}
            onSave={handleAddUser}
            onCancel={() => setShowAdd(false)}
            language={language}
          />
        </div>
      )}

      <div className="user-card">
        {loading ? (
          <p className="status-text">{t.loading}</p>
        ) : users.length === 0 ? (
          <p className="status-text">{t.noUsers}</p>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>{t.colNo}</th>
                <th>{t.colUsername}</th>
                <th>{t.colRole}</th>
                <th>{t.colActive}</th>
                <th>{t.colLocked}</th>
                <th>{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => (
                <tr key={u.id}>
                  <td>{index + 1}</td>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className={u.active ? "status active" : "status inactive"}>
                      {u.active ? t.yes : t.no}
                    </span>
                  </td>
                  <td>
                    <span className={u.accountLocked ? "status locked" : "status unlocked"}>
                      {u.accountLocked ? t.locked : t.no}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => setEditingUser(u)}>{t.editBtn}</button>
                    <button style={{ marginLeft: 6 }} onClick={() => setResetUser(u)}>{t.resetBtn}</button>
                    {auth.role === "SUPER_ADMIN" && u.accountLocked && (
                      <button style={{ marginLeft: 6 }} onClick={() => handleUnlockUser(u)}>{t.unlockBtn}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingUser && (
        <Modal title={t.modalEdit} onClose={() => setEditingUser(null)}>
          <EditUserForm user={editingUser} onSave={handleUpdateUser} onCancel={() => setEditingUser(null)} language={language} />
        </Modal>
      )}

      {resetUser && (
        <Modal title={t.modalReset} onClose={() => setResetUser(null)}>
          <ResetPasswordForm user={resetUser} onSave={handleResetPassword} onCancel={() => setResetUser(null)} language={language} />
        </Modal>
      )}
    </div>
  );
}
