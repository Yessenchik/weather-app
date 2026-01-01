const { getUsers, saveUsers } = require("../services/users.service");
const { runWorkerOnceInternal } = require("../jobs/scheduledEmailWorker");

async function listScheduled(req, res) {
    try {
        const users = await getUsers();

        const scheduled = users
            .filter((u) => u.schedule_at_ms) // if using schedule_at_ms
            .map((u) => ({
                email: u.email,
                city: u.city,
                schedule_at_ms: u.schedule_at_ms,
                schedule_at_human: new Date(u.schedule_at_ms).toString(),
            }));

        res.json({ count: scheduled.length, scheduled });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function cancelSchedule(req, res) {
    try {
        const email = String(req.params.email || "").trim().toLowerCase();
        if (!email) return res.status(400).json({ error: "Email param required" });

        const users = await getUsers();
        const user = users.find((u) => u.email === email);

        if (!user) return res.status(404).json({ error: "User not found" });

        user.schedule_at_ms = null;
        await saveUsers(users);

        res.json({ ok: true, message: "Schedule cancelled", email });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function runWorkerOnce(req, res) {
    try {
        const result = await runWorkerOnceInternal();
        res.json({ ok: true, ...result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    listScheduled,
    cancelSchedule,
    runWorkerOnce,
};