import AuthService from "./authService";

class UserService {

    authService = new AuthService();
    baseUrl = "/api/users";

    async request(url) {
        const token = this.authService.getToken();

        try {
            const response = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();
            return { status: response.status, data };

        } catch (err) {
            console.error(err);
            return { status: 500, data: { message: "Network error" } };
        }
    }

    async getUser(username) {
        const res = await this.request(`${this.baseUrl}/username/${username}`);
        if (res.status !== 200)
            return { success: false, message: res.data.message };
        return { success: true, user: res.data.user };
    }

    async getUserById(id) {
        const res = await this.request(`${this.baseUrl}/${id}`);
        if (res.status !== 200)
            return { success: false, message: res.data.message };
        return { success: true, user: res.data.user };
    }
}

export default UserService;
