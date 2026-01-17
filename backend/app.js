import express from "express";
import cors from "cors";
import { db } from "./db.js";

const app = express();

app.use(cors());
app.use(express.json());

// test route
app.get("/api/users/count", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT COUNT(*) AS cnt FROM users"
        );

        res.json({
            success: true,
            count: rows[0].cnt,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: "DB error",
        });
    }
});

const PORT = 8800;
app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
