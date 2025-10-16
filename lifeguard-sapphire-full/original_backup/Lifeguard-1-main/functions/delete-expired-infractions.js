const Infraction = require('../schemas/manual-infraction');

async function deleteExpiredInfractions() {
    try {
        const expiredInfraction = await Infraction.find({ expires: { $lte: new Date(Date.now()) } });

        for (const infraction of expiredInfraction) {
            await Infraction.findByIdAndDelete(infraction._id);
            console.log(`Deleted an expired infraction with ID: ${infraction.infractionId}.`);
        }
    } catch (error) {
        console.error(`An error occurred while checking and deleting expired infractions: ${error}`);
    }
}

module.exports = { deleteExpiredInfractions };