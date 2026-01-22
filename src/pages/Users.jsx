import { useEffect, useRef, useState } from "react";
import UserModal from "../components/UserModal";
import {useAuth} from "../AuthContext.jsx";
import { apiFetch } from "../utils/api.js";
import { useNotify } from "../context/NotificationContext";
import { useNavigate } from 'react-router-dom';

export default function Users() {
    const [users, setUsers] = useState([]);
    /*
    const modalRef = useRef(null); // не обязательно, но можно
    const API = import.meta.env.VITE_API || "http://localhost:8800";
    */
//    const { user } = useAuth();
    const { user, isAuth, isAdmin, logout } = useAuth();

    const navigate = useNavigate();

    const [modalMode, setModalMode] = useState(null);
    const [modalUserId, setModalUserId] = useState(null);

    const [currentUser, setCurrentUser] = useState(null);

    const { notify } = useNotify();



    async function loadUsers() {
        try {
            const data = await apiFetch("/api/users/get_all", {
                method: "GET",
            });

            setUsers(data);
        } catch (e) {
            notify("Ошибка сервера", "danger");
            navigate("/");
        }
    }
    useEffect(() => {
        loadUsers();
    }, []);

    async function changeRole(userId, newRole) {
        try {
            await apiFetch("/api/users/role", {
                method: "PUT",
                body: JSON.stringify({
                    userId,
                    role: newRole,
                }),
            });

            notify("Роль пользователя изменена", "success");
            loadUsers();

        } catch (e) {
            if (e.type === "AUTH") {
                notify("Сессия истекла. Перезайдите.", "danger");
                logout();
                return;
            }

            notify(e.message || "Ошибка смены роли", "danger");
        }
    }


    function openDelete(id) {
        setModalMode("delete");
        setModalUserId(id);
    }

    function openAdd() {
        setModalMode("add");
        setModalUserId(null);
    }

    function openEdit(id) {
        setModalMode("edit");
        setModalUserId(id);
    }


    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1>Пользователи</h1>

                <UserModal
                    mode={modalMode}
                    userId={modalUserId}
                    onDone={() => {
                        loadUsers();
                        setModalMode(null);
                    }}
                    onClose={() => setModalMode(null)}
                />
                <button className={`btn ${isAdmin ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => isAdmin && openAdd()}
                        disabled={!isAdmin}
                >
                    Добавить
                </button>

            </div>


            <div className="row fw-bold border-bottom pb-2">
                <div className="col-4">Имя</div>
                <div className="col-4">Email</div>
                <div className="col-4">...</div>
            </div>


            {users.map((u) => (
                <div className="row py-2 border-bottom" key={u.id}>
                    <div className="col-4">{u.name + (u.role===1?' (admin)':'')}</div>
                    <div className="col-4">{u.email}</div>
                    <div className="col-4">

                        {u.role === 1 ? (
                            <i
                                className={`bi bi-person-fill-down sy-user-op ${(isAdmin && user?.id !== u.id) ? "text-success" : "text-secondary"}`}
                                role="button"
                                onClick={() => (isAdmin && user?.id !== u.id) && changeRole(u.id, 0)}
                                title="Сделать пользователем"
                            />
                        ) : (
                            <i
                                className={`bi bi-person-fill-up sy-user-op ${(isAdmin && user?.id !== u.id) ? "text-warning" : "text-secondary"}`}
                                role="button"
                                onClick={() => (isAdmin && user?.id !== u.id) && changeRole(u.id, 1)}
                                title="Сделать админом"
                            />
                        )}

                        <i
                            className={`bi bi-person-fill-gear sy-user-op ${(isAdmin || user?.id === u.id) ? "text-primary" : "text-secondary"}`}
                            role="button"
                            onClick={() => (isAdmin || user?.id === u.id) && openEdit(u.id)}
                        />

                        <i
                            className={`bi bi-person-fill-slash sy-user-op ${(isAdmin && user?.id !== u.id) ? "text-danger" : "text-secondary"}`}
                            role="button"
                            onClick={() => (isAdmin && user?.id !== u.id) && openDelete(u.id)}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
