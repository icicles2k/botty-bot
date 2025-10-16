async function generateID() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000000000000000);
    const id = `${timestamp}${random}`.slice(0, 19);
    return id;
}

module.exports = { generateID };