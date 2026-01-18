const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(url, options = {}) {
    const fullUrl = `${API_URL}${url}`;

    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    // ⚠️ Authorization добавляем ТОЛЬКО если есть токен
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    console.log("[apiFetch] REQUEST →", fullUrl, {
        ...options,
        headers,
    });

    let res;
    try {
        res = await fetch(fullUrl, {
            ...options,
            headers,
            // ❌ credentials НЕ включаем по умолчанию
            // credentials: "include",
        });
    } catch (e) {
        console.error("[apiFetch] FETCH FAILED", e);
        throw {
            type: "NETWORK",
            message: "Сервер недоступен",
        };
    }

    console.log("[apiFetch] STATUS", res.status);

    let data;
    try {
        data = await res.json();
    } catch {
        throw {
            type: "NETWORK",
            message: "Сервер вернул не JSON",
        };
    }

    console.log("[apiFetch] RESPONSE ←", data);

    if (!res.ok || data?.success === false) {
        throw data;
    }

    return data.data;
}
