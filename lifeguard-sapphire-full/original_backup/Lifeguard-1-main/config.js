require('dotenv').config();

const ownerIDs = [
    '792168652563808306', // luvicicles
    '1223639595745542257', // koholaz
    '1205266015529865347' // crimson2xl
];

const staffIDs = [
    '792168652563808306', // luvicicles (Trial Moderator)
    '813580656617586688', // datmrdolphin (Trial Moderator)
    '994755825367253053', // antoma20 (Moderator)
    '746012469578956820', // violet_127 (Moderator)
];

const config = {
    prefix: '>',
    token: process.env.CLIENT_TOKEN,
    id: process.env.CLIENT_ID,
    owners: ownerIDs,
    staff: staffIDs,
};

module.exports = config;
