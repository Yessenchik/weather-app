function getRecommendation(f) {
    const temp = Number(f.temperature);
    const desc = (f.description || "").toLowerCase();
    const rain = Number(f.rain_last_3h || 0);

    if (rain > 0 || desc.includes("rain") || desc.includes("shower")) {
        return "Take an umbrella ☔";
    }
    if (!Number.isNaN(temp) && temp <= 5) {
        return "Dress warmly 🧥";
    }
    if (!Number.isNaN(temp) && temp >= 20) {
        return "Wear light clothes 👕";
    }
    return "Dress comfortably 🙂";
}

module.exports = { getRecommendation };