import express from "express";
import cors from "cors";
import { db } from "./db.js";

const app = express();

/* ===== ABSOLUTE MINIMUM CORS ===== */
app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

/* ===== TEST ROUTE ===== */
app.get("/api/ping", (req, res) => {
    res.json({ success: true, pong: true });
});

/* ===== USERS COUNT ===== */
app.get("/api/users/count", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT COUNT(*) AS cnt FROM users"
        );

        res.json({
            success: true,
            data: rows[0].cnt,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "DB error",
        });
    }
});

/* ===== USERS LIST ===== */
app.get("/api/users/get_all", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, name, email, role FROM users"
        );

        res.json({
            success: true,
            data: rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "DB error",
        });
    }
});

app.listen(8800, () => {
    console.log("API running on http://localhost:8800");
});
