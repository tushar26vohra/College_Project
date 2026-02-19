class AuthService {

    async loginUser(email, password) {
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || "Login failed"
                };
            }

            if (data.token) {
                localStorage.setItem("token", data.token);
            }

            return { success: true, token: data.token };

        } catch (err) {
            console.error("Login error:", err);
            return { success: false, message: "Network error" };
        }
    }

    async signUp(name, email, password, username) {
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password, username })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || "Signup failed"
                };
            }

            return { success: true, message: data.message };

        } catch (err) {
            console.error("Signup error:", err);
            return { success: false, message: "Network error" };
        }
    }

    getToken() {
        return localStorage.getItem("token");
    }

    logout() {
        localStorage.removeItem("token");
    }

    getUserData() {
        const token = this.getToken();
        if (!token) return null;

        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch {
            return null;
        }
    }
}

export default AuthService;
