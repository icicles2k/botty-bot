module.exports = {
    name: 'jigsaw',
    description: 'Aw hell naw...',
    flags: ['--goodending', '--australia', '--british'],
    staff: true,
    cooldown: 900,
    async execute(message, args) {
        const goodFlag = args.includes('--goodending');
        const australiaFlag = args.includes('--australia');
        const britishFlag = args.includes('--british');

        if (goodFlag) {
            return message.reply('aw hell yeah jigwaw, you da goat :speaking_head: :goat: :bangbang:');
        }

        if (australiaFlag) {
            return message.reply('your final challenge, let the missus go through your phone... nah, your taking the piss jigsaw :flag_au: :kangaroo: :upside_down:');
        }

        if (britishFlag) {
            return message.reply('oi, your final quest init, allow your bae to go through your mobile device... oi mate, your bloody delusional jigsaw :flag_gb: :coffee: :cake:')
        }

        return message.reply('Aw hell naw Jigsaw, yo ahh tweaking :sob: :sob: :fire: :x:');
    }
};