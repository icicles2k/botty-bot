const { EmbedBuilder } = require('discord.js');

const rules = {
    1: "1. This server has no tolerance for NSFW content. Media containing pornography, gore, abusive behaviors, and other sensitive content are not allowed. This also includes pictures, memes, conversations, or messages. In addition to this, we do not allow discussion / depiction of addictions (drugs, gambling, etc.).",
    2: "2. Do not troll, be toxic, cause arguments, or be rude to other members. Harassment is not allowed here, and can include racism, transphobia, use of slurs, or any other from of hatred based on identity. Please try to avoid sensitive topics that could cause drama such as politics and religion.",
    3: "3. Do not spam or flood chats with repetitive or long content. This can include flashy pictures, loud videos, as well as normal messages. Chaining by sending song lyrics in multiple messages is also not allowed. This includes VCs, where spamming can be abuse of soundboards, voice changers, and screaming.",
    4: "4. Due to the lack of international moderators, the server is English only. We may implement international chats in the future if we get more moderators that speak other languages. If you do not speak English, you may utilize Google Translate or other translation devices.",
    5: "5. Profile pictures, nicknames and bios may not depict any NSFW content, anything that breaks Discord's Terms of Service, or impersonate other members. You may be asked to change your profile picture if it violates this rule, and your nickname will be changed if it violates this rule.",
    6: "6. Advertising can include sending links to a Discord server, social media platform, or referral links. Sending these links anywhere in the server is not allowed and can result in punishment. This includes advertising in Direct Messages, which violates Discord's Terms of Service.",
    7: "7. Requesting personal information from other users is not allowed. This can be full names, phone numbers, home or work addresses, or any other revealing information about people. In addition to this, sharing personal information, better known as \"doxxing\", is also not allowed.",
    8: "8. You must be 13 years of age to use this Discord server, as well as follow Discord's Terms of Service and Guidelines. They have been linked below:\n:link: https://discord.com/terms\n:link: https://discord.com/guidelines",
}

module.exports = {
    name: 'rule',
    description: 'Shows a specific rule.',
    staff: true,
    async execute(message, args) {
        let targetUser = null;
        let ruleNumber;

        if (message.mentions.members.size > 0) {
            targetUser = message.mentions.members.first();
            ruleNumber = parseInt(args[1]);
        } else if (args.length > 1) {
            try {
                targetUser = await message.guild.members.fetch(args[0]);
                ruleNumber = parseInt(args[1]);
            } catch (error) {
                ruleNumber = parseInt(args[0]);
            }
        } else {
            ruleNumber = parseInt(args[0]);
        }

        if (isNaN(ruleNumber) || ruleNumber < 1 || ruleNumber > Object.keys(rules).length) {
            const embed = new EmbedBuilder()
            .setColor('#eb4034')
            .setDescription(`Invalid rule. Please provide a number between 1 and ${Object.keys(rules).length}.`)
            const msg = await message.channel.send({ embeds: [embed] });
            setTimeout(() => {
                message.delete();
                msg.delete();
            }, 2000);

            return;
        }

        const embed = new EmbedBuilder()
        .setColor('#eb4034')
        .setDescription(rules[ruleNumber])

        if (targetUser) {
            await message.channel.send({ content: `<@${targetUser.id}>`, embeds: [embed] });
        } else {
            await message.channel.send({ embeds: [embed] });
        }
    },
};