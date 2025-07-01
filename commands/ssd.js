const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');

const HR_ID = process.env.HR_ID;
const SESSIONS_CH_ID = process.env.SESSIONS_CH_ID;
const BANNER_IMAGE_URL = 'https://via.placeholder.com/1024x250?text='; 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ssd')
    .setDescription('Send a session shutdown notification embed.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(i) {
    if (!i.member.roles.cache.has(HR_ID)) {
      return i.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: i.user.tag, iconURL: i.user.displayAvatarURL() })
      .setColor('DarkRed')
      .setTitle('**Session Shutdown**')
      .setDescription(
        'The in-game server has now shutdown! During this period, do not join the in-game server or moderation actions may be taken against you!\n\n' +
        'Another session will occur shortly, thank you!\n\n' +
        `Shutdown: <t:${Math.floor(Date.now() / 1000)}:F>`
      )
      .setImage(BANNER_IMAGE_URL);

    const ch = await i.client.channels.fetch(SESSIONS_CH_ID);
    if (!ch?.isTextBased()) {
      return i.reply({ content: '❌ Could not find the sessions channel.', ephemeral: true });
    }

    await ch.send({ embeds: [embed] });
    await i.reply({ content: '✅ Session Shutdown embed sent.', ephemeral: true });
  }
};
