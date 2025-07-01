const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} = require('discord.js');

const CHANNEL_ID = process.env.SESSIONS_CH_ID;
const PING_ROLE_ID = '1371248467833393305'; // replace with ur role id that u want pinged
const ALLOWED_ROLE_ID = process.env.HR_ID;
const BANNER_IMAGE_URL = 'https://via.placeholder.com/1024x250?text='; // replace with ur image url

let voters = new Set(); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ssuvote')
    .setDescription('Start a session vote.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    voters.clear(); 

    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setColor('Blurple')
      .setDescription(
        `**Session Vote - insert server name**\n\n` +
        `A session vote has been initiated! If you vote during this time, you are required to join the in-game server within 15 minutes to avoid moderation!\n\n` +
        `Votes Needed: **8**\n` +
        `Vote Started: <t:${timestamp}:R>`
      )
      .setImage(BANNER_IMAGE_URL);

    let voteButton = new ButtonBuilder()
      .setCustomId('vote_button')
      .setLabel('✅ (0)')
      .setStyle(ButtonStyle.Success);

    let viewVotersButton = new ButtonBuilder()
      .setCustomId('view_voters')
      .setLabel('🔎 View Voters')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(voteButton, viewVotersButton);

    const channel = await interaction.client.channels.fetch(CHANNEL_ID);
    const sentMessage = await channel.send({
      content: `@here <@&${PING_ROLE_ID}>`,
      embeds: [embed],
      components: [row],
    });

    await interaction.reply({ content: '✅ Session vote started.', ephemeral: true });

    const collector = sentMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15 * 60 * 1000, 
    });

    collector.on('collect', async i => {
      if (i.customId === 'vote_button') {
        if (voters.has(i.user.id)) {
          return i.reply({ content: '❗ You have already voted.', ephemeral: true });
        }

        voters.add(i.user.id);

        voteButton = ButtonBuilder.from(voteButton)
          .setLabel(`✅ (${voters.size})`);

        const updatedRow = new ActionRowBuilder().addComponents(voteButton, viewVotersButton);
        await sentMessage.edit({ components: [updatedRow] });

        return i.reply({ content: '✅ Your vote has been recorded.', ephemeral: true });
      }

      if (i.customId === 'view_voters') {
        if (voters.size === 0) {
          return i.reply({ content: 'No one has voted yet.', ephemeral: true });
        }

        const names = Array.from(voters).map(id => `<@${id}>`).join('\n');
        return i.reply({ content: `🧾 Voters:\n${names}`, ephemeral: true });
      }
    });

    collector.on('end', async () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        ButtonBuilder.from(voteButton).setDisabled(true),
        ButtonBuilder.from(viewVotersButton).setDisabled(true)
      );

      await sentMessage.edit({ components: [disabledRow] });
    });
  },
};