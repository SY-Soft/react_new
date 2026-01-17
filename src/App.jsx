import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
    const [count, setCount] = useState(0);
    const [usersCount, setUsersCount] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}/api/users/count`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setUsersCount(data.count);
                }
            })
            .catch((err) => {
                console.error("API error:", err);
            });
    }, []);

    return (
        <>
            <div>
                <a href="https://vite.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
            </div>

            <h1>Vite + React</h1>

            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>

                {/* 👇 РЕЗУЛЬТАТ БЭКА */}
                <p style={{ marginTop: 12 }}>
                    Users in DB:{" "}
                    <strong>
                        {usersCount === null ? "loading..." : usersCount}
                    </strong>
                </p>

                <p>
                    Edit <code>src/App.jsx</code> and save to test HMR
                </p>
            </div>

            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
        </>
    );
}

export default App;
