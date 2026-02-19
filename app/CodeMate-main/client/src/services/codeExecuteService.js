class CodeExecuteService {

    async getSupportedLanguages() {
        try {
            const response = await fetch("/api/code/languages");
            if (!response.ok) return [];

            return await response.json();
        } catch (err) {
            console.error("Language fetch error:", err);
            return [];
        }
    }

    async executeCode(currentFileCode, languageId, stdin) {
        try {
            const response = await fetch("/api/code/execute", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    code: currentFileCode,
                    language_id: languageId,
                    stdin: stdin
                })
            });

            if (!response.ok)
                return { success: false };

            return await response.json();

        } catch (err) {
            console.error("Execute error:", err);
            return { success: false };
        }
    }
}

export default CodeExecuteService;
