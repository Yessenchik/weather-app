const { readJSON, writeJSON } = require("../storage/fileStore");

const FAVORITES_FILE = "favorites.json";

function normalizeCity(city) {
    return city.trim();
}

function sameCity(a, b) {
    return a.toLowerCase() === b.toLowerCase();
}

async function getFavorites() {
    return readJSON(FAVORITES_FILE, []);
}

async function addFavorite(city) {
    const clean = normalizeCity(city);
    const favorites = await getFavorites();

    const exists = favorites.some((c) => sameCity(c, clean));
    if (!exists) {
        favorites.push(clean);
        await writeJSON(FAVORITES_FILE, favorites);
    }

    return favorites;
}

async function findFavorite(city) {
    const clean = normalizeCity(city);
    const favorites = await getFavorites();

    const found = favorites.find((c) => sameCity(c, clean));
    return found || null;
}

async function removeFavorite(city) {
    const clean = normalizeCity(city);
    const favorites = await getFavorites();

    const filtered = favorites.filter((c) => !sameCity(c, clean));
    const removed = filtered.length !== favorites.length;

    if (removed) {
        await writeJSON(FAVORITES_FILE, filtered);
    }

    return { removed, favorites: filtered };
}

async function moveFavorite(city, newIndex) {
    const clean = normalizeCity(city);
    const favorites = await getFavorites();

    const currentIndex = favorites.findIndex((c) => sameCity(c, clean));
    if (currentIndex === -1) return { ok: false, reason: "NOT_FOUND" };

    if (!Number.isInteger(newIndex)) return { ok: false, reason: "BAD_INDEX" };
    if (newIndex < 0 || newIndex >= favorites.length) return { ok: false, reason: "BAD_INDEX" };

    const [item] = favorites.splice(currentIndex, 1);
    favorites.splice(newIndex, 0, item);

    await writeJSON(FAVORITES_FILE, favorites);
    return { ok: true, favorites };
}

module.exports = {
    getFavorites,
    addFavorite,
    findFavorite,
    removeFavorite,
    moveFavorite,
};