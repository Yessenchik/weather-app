const app = require("./app");

const PORT = process.env.PORT || 3000;

// const { startScheduledEmailWorker } = require("./jobs/scheduledEmailWorker");
// startScheduledEmailWorker();

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})