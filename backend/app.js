import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./db.js";

const app = express();
const PORT = 8800;
const SECRET = process.env.JWT_SECRET;

/* ===================== CORS ===================== */
app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

/* ===================== HELPERS ===================== */

function ok(res, data = null, message = null) {
    return res.json({
        success: true,
        data,
        message,
    });
}

function fail(
    res,
    {
        type = "BUSINESS",
        errors = null,
        message = "Ошибка",
    } = {}
) {
    return res.json({
        success: false,
        type,
        errors,
        message,
    });
}

function authFail(res, message = "Unauthorized") {
    return res.json({
        success: false,
        type: "AUTH",
        message,
    });
}

/* ===================== MIDDLEWARE ===================== */

function checkAdmin(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) {
        return authFail(res, "Нет токена");
    }

    try {
        const token = auth.split(" ")[1];
        const decoded = jwt.verify(token, SECRET);

        if (decoded.role !== 1 && decoded.id !== req.body.id) {
            return authFail(res, "Недостаточно прав");
        }

        req.user = decoded;
        next();
    } catch (e) {
        return authFail(res, "Невалидный или истёкший токен. Перезайдите.");
    }
}

/* ===================== TEST ===================== */

app.get("/api/ping", (req, res) => {
    ok(res, { pong: true });
});

/* ===================== AUTH ===================== */

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return fail(res, {
            type: "VALIDATION",
            errors: {
                email: !email ? "Обязательное поле" : undefined,
                password: !password ? "Обязательное поле" : undefined,
            },
        });
    }

    try {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (!rows.length) {
            return authFail(res, "Неверный логин или пароль");
        }

        const user = rows[0];

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return authFail(res, "Неверный логин или пароль");
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            SECRET,
            { expiresIn: "2h" }
        );

        delete user.password;

        return ok(res, { token, user });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return fail(res, { message: "Ошибка сервера" });
    }
});



app.get("/api/users/count", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT COUNT(*) AS cnt FROM users"
        );
        ok(res, rows[0].cnt);
    } catch (err) {
        console.error(err);
        fail(res, { message: "DB error" });
    }
});

app.get("/api/users/get_all", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, name, email, role FROM users"
        );
        ok(res, rows);
    } catch (err) {
        console.error(err);
        fail(res, { message: "DB error" });
    }
});

app.post("/api/users/get", checkAdmin, async (req, res) => {
    const { id } = req.body;

    const [rows] = await db.query(
        "SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1",
        [id]
    );

    if (!rows.length) {
        return fail(res, { message: "Пользователь не найден" });
    }

    ok(res, rows[0]);
});

app.delete("/api/users/:id", checkAdmin, async (req, res) => {
    await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    ok(res);
});

app.post("/api/users/save", checkAdmin, async (req, res) => {
    const { id, name, email, password } = req.body;

    /* ===== базовая валидация ===== */

    const errors = {};

    if (!name || name.trim().length < 3 || name.trim().length > 32) {
        errors.name = "Имя должно быть от 3 до 32 символов";
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Неверный email";
    }

    // пароль проверяем ТОЛЬКО при добавлении или если он задан
    if (!id && (!password || password.length < 5)) {
        errors.password = "Пароль минимум 5 символов";
    }

    if (password && password.length > 0 && password.length < 5) {
        errors.password = "Пароль минимум 5 символов";
    }

    if (Object.keys(errors).length > 0) {
        return fail(res, {
            type: "VALIDATION",
            errors,
        });
    }

    try {
        /* ===== проверка уникальности email ===== */

        let q = "SELECT id FROM users WHERE email = ?";
        const params = [email];

        if (id) {
            q += " AND id <> ?";
            params.push(id);
        }

        const [exists] = await db.query(q, params);

        if (exists.length) {
            return fail(res, {
                type: "BUSINESS",
                errors: {
                    email: "Email уже используется",
                },
            });
        }

        /* ===== UPDATE ===== */

        if (id) {
            // базовое обновление
            await db.query(
                "UPDATE users SET name=?, email=? WHERE id=?",
                [name, email, id]
            );

            // если пароль указан — обновляем отдельно
            if (password && password.length > 0) {
                const hash = await bcrypt.hash(password, 10);
                await db.query(
                    "UPDATE users SET password=? WHERE id=?",
                    [hash, id]
                );
            }

            /* ===== INSERT ===== */
        } else {
            const hash = await bcrypt.hash(password, 10);

            await db.query(
                "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 0)",
                [name, email, hash]
            );
        }

        return ok(res);

    } catch (err) {
        console.error("USERS SAVE ERROR:", err);
        return fail(res, { message: "Ошибка сервера" });
    }
});

app.put("/api/users/role", checkAdmin, async (req, res) => {
    const { userId, role } = req.body;

    // ===== validation =====
    if (!userId || typeof role !== "number") {
        return fail(res, {
            type: "VALIDATION",
            message: "Некорректные данные",
        });
    }

    // запрет админу менять роль самому себе
    if (req.user.id === userId) {
        return fail(res, {
            type: "BUSINESS",
            message: "Нельзя изменить роль самому себе",
        });
    }

    try {
        const [result] = await db.query(
            "UPDATE users SET role = ? WHERE id = ?",
            [role, userId]
        );

        if (result.affectedRows === 0) {
            return fail(res, {
                type: "BUSINESS",
                message: "Пользователь не найден",
            });
        }

        return ok(res);

    } catch (err) {
        console.error(err);
        return fail(res, { message: "DB error" });
    }
});



/* ===================== START ===================== */

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
