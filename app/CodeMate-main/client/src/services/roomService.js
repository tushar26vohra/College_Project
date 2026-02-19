import AuthService from "./authService";

class RoomService {

    authService = new AuthService();
    baseUrl = "/api/room";

    async request(endpoint, method = "GET", body = null) {
        const token = this.authService.getToken();

        try {
            const response = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? `Bearer ${token}` : ""
                },
                body: body ? JSON.stringify(body) : null
            });

            const data = await response.json().catch(() => ({}));

            return { status: response.status, data };

        } catch (err) {
            console.error("Room API error:", err);
            return { status: 500, data: { message: "Network error" } };
        }
    }

    async getRoomsByUsername(username) {
        const res = await this.request(`${this.baseUrl}/user/${username}`);
        if (res.status !== 200)
            return { success: false, message: res.data.message };
        return { success: true, rooms: res.data };
    }

    async getRoomById(id) {
        const res = await this.request(`${this.baseUrl}/${id}`);
        if (res.status !== 200)
            return { success: false, message: res.data.message };
        return { success: true, room: res.data.room };
    }

    async createRoom(owner, title) {
        const res = await this.request(`${this.baseUrl}`, "POST", { owner, title });
        if (res.status !== 200)
            return { success: false, message: res.data.message };
        return { success: true, room: res.data.room };
    }

    async addFile(roomId, file) {
        const res = await this.request(`${this.baseUrl}/add-file`, "POST", { roomId, file });
        if (res.status !== 200)
            return { success: false, message: res.data.message };
        return { success: true, file: res.data.file };
    }

    async updateCode(roomId, fileId, code) {
        const res = await this.request(`${this.baseUrl}/update-file-content`, "PUT", { roomId, fileId, code });
        if (res.status !== 200)
            return { success: false, message: res.data.message };
        return { success: true, file: res.data.file };
    }

    async deleteFile(roomId, fileId) {
        const res = await this.request(`${this.baseUrl}/delete-file`, "DELETE", { roomId, fileId });
        if (res.status !== 200)
            return { success: false, message: res.data.message };
        return { success: true };
    }
}

export default RoomService;
