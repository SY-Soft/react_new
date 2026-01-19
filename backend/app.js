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
        return authFail(res, "Невалидный или истёкший токен");
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


/* ===================== USERS ===================== */

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

/* ===================== START ===================== */

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
