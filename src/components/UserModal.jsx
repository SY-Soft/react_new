import {useEffect, useState} from "react";
import {apiFetch} from "../utils/api.js";
import {useNotify} from "../context/NotificationContext";
import { useAuth } from "../AuthContext";


export default function UserModal({
                                      mode,
                                      userId,
                                      onDone,
                                      onClose,
                                  }) {
    const isEdit = mode === "edit";
    const isAdd = mode === "add";
    const isDelete = mode === "delete";

    const { isAdmin, isAuth, user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [targetUser, setTargetUser] = useState(null);
    const [error, setError] = useState("");
    const [errors, setErrors] = useState({});

    const {notify} = useNotify();

    // ===== form state =====
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const isSelfEdit = isEdit && userId === user?.id;
    const canEdit = isAuth && (isAdmin || isSelfEdit);



    // ===== load user for edit / delete =====
    useEffect(() => {
        if (!mode) return;
        if (!canEdit) return;

        if (isAdd) {
            setName("");
            setEmail("");
            setPassword("");
            setTargetUser(null);
            return;
        }

        if (!userId) return;

        setLoading(true);

        apiFetch("/api/users/get", {
            method: "POST",
            body: JSON.stringify({ id: userId }),
        })
            .then(data => {
                setTargetUser(data);
                setName(data.name);
                setEmail(data.email);
            })
            .catch(e => {
                notify(e.message || "Ошибка загрузки", "danger");
                onClose();
            })
            .finally(() => setLoading(false));
    }, [mode, userId, canEdit]);

    if (!canEdit) return null;
    if (!mode) return null;

    // ===== delete =====
    async function handleDelete() {
        setLoading(true);
        try {
            await apiFetch(`/api/users/${userId}`, {
                method: "DELETE",
            });

            notify("Пользователь удален", "success");
            onDone();
            onClose();

        } catch (e) {
            notify(e.message, "danger");
        }
        //**
        // setLoading(true);
        // setError("");
    }

    // ===== add / edit =====
    async function handleSubmit() {
        // 🔹 1. локальная валидация
        const newErrors = {};

        if (!name || name.trim().length < 3 || name.trim().length > 32) {
            newErrors.name = "Имя должно быть от 3 до 32 символов";
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Неверный email";
        }

        if (isAdd && (!password || password.length < 5)) {
            newErrors.password = "Пароль минимум 5 символов";
        }
        console.log(newErrors);
        // 🔴 если есть ошибки — НЕ идём дальше
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // 🔹 2. ошибок нет — чистим и шлём запрос
        setErrors({});
        setLoading(true);

        try {
            const payload = {
                id: isEdit ? targetUser.id : null,
                name,
                email,
                password: password || null,
            };

            await apiFetch(`/api/users/save`, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            notify(`Пользователь ${isEdit ? "обновлен" : "добавлен"}`, "success");
            onDone();
            onClose();

        } catch (e) {
            if (e.type === "BUSINESS" || e.type === "VALIDATION" ) {
                setErrors(e.errors || {});
                return;
            }

            notify(e.message || "Ошибка сохранения", "danger");
        } finally {
            setLoading(false);
        }
    }

    if (!mode) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">

                    <div className="modal-header">
                        <h5 className="modal-title">
                            {isAdd && "Добавить пользователя"}

                            {isEdit && targetUser && (
                                <>
                                    Редактирование пользователя:{" "}
                                    <strong>
                                        {targetUser.name}
                                        {targetUser.role === 1 ? " (admin)" : ""}
                                    </strong>
                                </>
                            )}

                            {isDelete && "Удалить пользователя"}
                        </h5>

                        <button className="btn-close" onClick={onClose}/>
                    </div>

                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-danger">{error}</div>
                        )}

                        {isDelete && (
                            <>
                                {loading && <p>Загрузка...</p>}

                                {targetUser && (
                                    <p>
                                        Вы уверены, что хотите удалить пользователя{" "}
                                        <strong>
                                            {targetUser.name}
                                            {targetUser.role === 1 ? " (admin)" : ""}
                                        </strong>
                                        ?
                                    </p>
                                )}
                            </>
                        )}

                        {(isAdd || isEdit) && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Имя</label>
                                    <input
                                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                    {errors.name && (
                                        <div className="invalid-feedback">
                                            {errors.name}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                    {errors.email && (
                                        <div className="invalid-feedback">
                                            {errors.email}
                                        </div>
                                    )}

                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        Пароль {isEdit && "(необязательно)"}
                                    </label>
                                    <input
                                        type="password"
                                        className={`form-control ${errors.password ? "is-invalid" : ""}`}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    {errors.password && (
                                        <div className="invalid-feedback">
                                            {errors.password}
                                        </div>
                                    )}

                                </div>
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>
                            Отмена
                        </button>

                        {isDelete && (
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                Удалить
                            </button>
                        )}

                        {(isAdd || isEdit) && (
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {isAdd ? "Добавить" : "Сохранить"}
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
