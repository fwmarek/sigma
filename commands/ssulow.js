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
const img = 'https://via.placeholder.com/1024x250?text='; //. replace with your sessions image
const qj = 'https://www.roblox.com/games/2534724415/ERLC'; // kano replace with your erlc quickjoin url;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ssulow')
    .setDescription('Send a low activity session boost announcement.')
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
      .setDescription('The in-game server is still up! Join us for some amazing, professional roleplays!')
      .setImage(img);

    const btn = new ButtonBuilder()
      .setLabel('Quick Join')
      .setStyle(ButtonStyle.Link)
      .setURL(qj);

    const row = new ActionRowBuilder().addComponents(btn);

    const ch = await i.client.channels.fetch(chId);
    await ch.send({
      content: `<@&${hrId}>`,
      embeds: [embed],
      components: [row],
    });

    await i.reply({ content: '✅ Low session boost sent.', ephemeral: true });
  },
};
