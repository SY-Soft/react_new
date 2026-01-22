import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Header() {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
            <div className="container">
                <NavLink className="navbar-brand" to="/">MyReact</NavLink>

                {user ? (
                    <span className="sy-header-debug">
                        Вы {user.name}, и вы {user.role === 1 ? "admin" : "user"}
                    </span>
                ) : (
                    <span className="sy-header-debug">Вы гость <i class="bi bi-emoji-smile"></i></span>
                )}

                <div className="navbar-nav">
                    <NavLink className="nav-link" to="/">Главная</NavLink>
                    <NavLink className="nav-link" to="/more_details">Подробнее</NavLink>
                    <NavLink className="nav-link" to="/about">О проекте</NavLink>
                    <NavLink className="nav-link" to="/users">Юзеры</NavLink>

                    {user ? (
                        <a className="nav-link sy-link-ico" onClick={logout}>
                            <i className="bi bi-box-arrow-right"></i>
                        </a>
                    ) : (
                        <NavLink className="nav-link sy-link-ico" to="/login">
                            <i className="bi bi-box-arrow-in-right"></i>
                        </NavLink>
                    )}
                </div>
            </div>
        </nav>
    );
}
