import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import Users from "./pages/Users";
import About from "./pages/About";
import More_details from "./pages/More_details";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="users" element={<Users />} />
                <Route path="about" element={<About />} />
                <Route path="more_details" element={<More_details />} />
            </Route>
        </Routes>
    );
}
