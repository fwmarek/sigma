const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const chId = process.env.SESSIONS_CH_ID;
const hrId = process.env.HR_ID;
const img = 'https://via.placeholder.com/1024x250?text='; // replace pls !!!!!!!!
const qj = 'https://join.url'; // replace kano! !!!! ! !!
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ssufull')
    .setDescription('Send a session full notification embed.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(i) {
    if (!i.member.roles.cache.has(hrId)) {
      return i.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: i.user.tag, iconURL: i.user.displayAvatarURL() })
      .setDescription(
        'Full Server!\nThe in-game server is now full! Keep trying to join for some amazing, professional roleplays!\n\n' +
        `Got full: <t:${Math.floor(Date.now() / 1000)}:F>`
      )
      .setImage(img);

    const btn = new ButtonBuilder()
      .setLabel('Quick Join')
      .setStyle(ButtonStyle.Link)
      .setURL(qj);

    const row = new ActionRowBuilder().addComponents(btn);

    const ch = await i.client.channels.fetch(chId);
    await ch.send({ embeds: [embed], components: [row] });

    await i.reply({
      content: '✅ Session Full embed sent.',
      ephemeral: true
    });
  }
};
