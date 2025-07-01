const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js');

require('dotenv').config();

const chId = process.env.SESSIONS_CH_ID;
const hrId = process.env.HR_ID;
const pingId = '1371248467833393305'; // kano insert the roleid u want pinged
const joinUrl = 'https://join.url'; // insrt ur quickjoin url for erlc
const img = 'https://via.placeholder.com/1024x250?text=';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ssu')
    .setDescription('Announce a Session Startup.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(i) {
    if (!i.member.roles.cache.has(hrId)) {
      return i.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const stamp = Math.floor(Date.now() / 1000);

    const embed = new EmbedBuilder()
      .setAuthor({ name: i.user.tag, iconURL: i.user.displayAvatarURL() })
      .setColor('Blurple')
      .setDescription(
        `**Session Startup**\n\n` +
        `A session has been initiated! If you voted during the voting period, you are required to join the server to avoid moderation!\n\n` +
        `•⠀Server Owner: \`exampleOwner\`\n` +
        `•⠀Server Name: \`exampleName\`\n` +
        `•⠀Server Code: \`exampleCode\`\n\n` +
        `Session Started: <t:${stamp}:R>`
      )
      .setImage(img);

    const btn = new ButtonBuilder()
      .setLabel('Quick Join')
      .setStyle(ButtonStyle.Link)
      .setURL(joinUrl);

    const row = new ActionRowBuilder().addComponents(btn);
    const ch = await i.client.channels.fetch(chId);

    await ch.send({
      content: `@here <@&${pingId}>`,
      embeds: [embed],
      components: [row],
    });

    await i.reply({ content: '✅ Session announcement has been posted.', ephemeral: true });
  },
};
