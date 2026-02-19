// login - /api/auth/login
// signup - /api/auth/register

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

            if (!response) {
                return { success: false, message: "No response from server" };
            }

            if (response.status === 404)
                return { success: false, message: "Invalid Email" };

            if (response.status === 400)
                return { success: false, message: "Invalid password" };

            if (response.status === 500)
                return { success: false, message: "Internal server error" };

            const data = await response.json();
            const token = data.token;

            localStorage.setItem("token", token);

            return { success: true, token };

        } catch (err) {
            console.error(err);
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

            if (!response) {
                return { success: false, message: "No response from server" };
            }

            if (response.status === 400)
                return { success: false, message: "User already exists" };

            if (response.status === 500)
                return { success: false, message: "Internal server error" };

            const data = await response.json();

            return { success: true, message: data.message };

        } catch (err) {
            console.error(err);
            return { success: false, message: "Network error" };
        }
    }

    getToken() {
        const token = localStorage.getItem("token");
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);

            if (payload.exp && payload.exp > currentTime) {
                return token;
            } else {
                this.logout();
                return null;
            }
        } catch (err) {
            console.error("Error decoding JWT:", err);
            return null;
        }
    }

    logout() {
        localStorage.removeItem("token");
    }

    getUserData() {
        const token = this.getToken();
        return token ? JSON.parse(atob(token.split('.')[1])) : null;
    }
}

export default AuthService;
