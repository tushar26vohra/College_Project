class CodeExecuteService {

    async getSupportedLanguages() {
        try {
            const response = await fetch("/api/code/languages");

            if (!response)
                return [];

            if (response.status !== 200)
                return [];

            return await response.json();

        } catch (err) {
            console.error(err);
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

            if (!response)
                return { success: false };

            return await response.json();

        } catch (err) {
            console.error(err);
            return { success: false };
        }
    }
}

export default CodeExecuteService;
