const fs = require("fs").promises;
const path = require("path");

// Reads JSON from a file in this folder (/storage)
async function readJSON(filename, defaultValue) {
    const fullPath = path.join(__dirname, filename);

    try {
        const raw = await fs.readFile(fullPath, "utf-8");
        return JSON.parse(raw);
    } catch (err) {
        if (err.code === "ENOENT") return defaultValue;
        throw err;
    }
}

async function writeJSON(filename, value) {
    const fullPath = path.join(__dirname, filename);
    const pretty = JSON.stringify(value, null, 2);
    await fs.writeFile(fullPath, pretty, "utf-8");
}

module.exports = { readJSON, writeJSON };