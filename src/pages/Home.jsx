// src/pages/Home.jsx
export default function Home() {
    return (
        <div className="home-page" style={{border:"red 1px dotted"}}>
            <section className="mb-5">
                <h1 className="mb-3">Dashboard</h1>
                <p className="text-muted">
                    Добро пожаловать. Это стартовая страница приложения.
                </p>
            </section>

            <section className="row g-4">
                <div className="col-md-4">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title">Users</h5>
                            <p className="card-text">
                                Управление пользователями системы.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title">API</h5>
                            <p className="card-text">
                                Подключение к backend и статус сервисов.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title">About</h5>
                            <p className="card-text">
                                Информация о проекте и структуре.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
