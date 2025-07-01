const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require('discord.js');

const roleOptions = [
  { label: 'Moderator', value: 'Moderator' },
  { label: 'Sr Moderator', value: 'Sr Moderator' },
  { label: 'Administrator', value: 'Administrator' },
  { label: 'Sr Administrator', value: 'Sr Administrator' },
  { label: 'Staff Supervisor', value: 'Staff Supervisor' },
  { label: 'Manager', value: 'Manager' },
  { label: 'Community Manager', value: 'Community Manager' },
  { label: 'Assistant Director', value: 'Assistant Director' },
  { label: 'Deputy Director', value: 'Deputy Director' },
  { label: 'Director', value: 'Director' },
];

const HR_ID = process.env.HR_ID;
const PROMO_CHANNEL_ID = process.env.PROMO_CHANNEL_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Announce a staff promotion')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('The user being promoted')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('old_rank')
        .setDescription('Their old rank')
        .setRequired(true)
        .addChoices(...roleOptions.map(r => ({ name: r.label, value: r.value })))
    )
    .addStringOption(opt =>
      opt.setName('new_rank')
        .setDescription('Their new rank')
        .setRequired(true)
        .addChoices(...roleOptions.map(r => ({ name: r.label, value: r.value })))
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Why are they being promoted?')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    if (!HR_ID || !PROMO_CHANNEL_ID) {
      return interaction.reply({
        content: '❌ Configuration error: HR_ID or PROMO_CHANNEL_ID not set in environment variables.',
        ephemeral: true
      });
    }

    if (!interaction.member.roles.cache.has(HR_ID)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');
    const oldRank = interaction.options.getString('old_rank');
    const newRank = interaction.options.getString('new_rank');
    const reason = interaction.options.getString('reason');

    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setDescription(
        `**Staff Promotion**\n\n` +
        `**User:** ${user}\n` +
        `**Old Rank:** ${oldRank}\n` +
        `**New Rank:** ${newRank}\n` +
        `**Reason:** ${reason}`
      );

    const button = new ButtonBuilder()
      .setLabel(`Issuer: ${interaction.user.username}`)
      .setStyle(ButtonStyle.Secondary)
      .setCustomId('issuer-button')
      .setDisabled(true);

    const row = new ActionRowBuilder().addComponents(button);

    let promoChannel;
    try {
      promoChannel = await interaction.client.channels.fetch(PROMO_CHANNEL_ID);
    } catch (err) {
      console.error('❌ Failed to fetch promotion channel:', err);
    }

    if (!promoChannel || !promoChannel.isTextBased()) {
      return interaction.reply({
        content: '❌ Could not find or access the promotion channel.',
        ephemeral: true
      });
    }

    await promoChannel.send({ content: `${user}`, embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Promotion announced for ${user}.`, ephemeral: true });
  },
};
