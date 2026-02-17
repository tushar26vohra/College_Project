// require("dotenv").config()
// const { main } = require("../execute");

// const executeCode = async (req, res) => {
//     const code = req.body.code;
//     const language_id = req.body.language_id;
//     const stdin = req.body.stdin;

//     if (!code) {
//         return res.status(400).json({ error: "Code is required" });
//     }

//     try {
//         const { type, output } = await main(code, language_id, stdin);

//         if (type === 'stdout') {
//             res.status(200).json({ success: true, output });
//         }
//         else if (type === 'stderr') {
//             res.status(200).json({ success: false, error: output });
//         }
//     }
//     catch (error) {
//         console.error("Error during code execution:", error);
//         res.status(500).json({ error: "An error occurred during code execution" });
//     }
// };

// function cmp(a, b)
// {
//     return a.id < b.id ? -1 : 1;
// }

// const getLanguages = async (req, res) => {
//   const baseUrl = "https://ce.judge0.com"; // Free Judge0

//   try {
//     console.log("🔄 Fetching languages from Judge0 (no API key)...");

//     const response = await fetch(`${baseUrl}/languages`);

//     if (!response.ok) {
//       throw new Error(`Judge0 API error: ${response.status} ${response.statusText}`);
//     }

//     let result = await response.json();

//     console.log("Languages fetched from Judge0:", result.length);

//     result = result.filter((l) => l.id <= 80).sort((a, b) => (a.id < b.id ? -1 : 1));

//     res.status(200).json({ result });
//   } catch (error) {
//     console.error("Error while fetching supported languages (Judge0):", error);
//     res.status(500).json({ error: "An error occurred while fetching supported languages" });
//   }
// };

// module.exports = {
//     executeCode,
//     getLanguages,
// }

require("dotenv").config();

const executeCode = async (req, res) => {
  const { code, language_id, stdin } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    console.log("Executing code (demo mode)");

    // 🔥 Dummy execution logic for demo
    const output = `
Language ID: ${language_id}
Input: ${stdin || "No input provided"}
Code Received Successfully!
`;

    res.status(200).json({
      success: true,
      output: output,
    });

  } catch (error) {
    console.error("Execution error:", error);
    res.status(500).json({ error: "Execution failed" });
  }
};

const getLanguages = async (req, res) => {
  console.log("Returning static languages (offline mode)");

  const result = [
    { id: 71, name: "Python" },
    { id: 54, name: "C++" },
    { id: 63, name: "JavaScript" },
    { id: 62, name: "Java" },
    { id: 50, name: "C" }
  ];

  res.status(200).json({ result });
};

module.exports = {
  executeCode,
  getLanguages,
};
