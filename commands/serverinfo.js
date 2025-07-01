const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
  TimestampStyles,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Get detailed info about the server'),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    const owner = await guild.fetchOwner();

    const channels = guild.channels.cache;
    const channelCounts = {
      text: channels.filter(c => c.type === ChannelType.GuildText).size,
      voice: channels.filter(c => c.type === ChannelType.GuildVoice).size,
      categories: channels.filter(c => c.type === ChannelType.GuildCategory).size,
      stage: channels.filter(c => c.type === ChannelType.GuildStageVoice).size,
      news: channels.filter(c => c.type === ChannelType.GuildAnnouncement).size,
      threads: channels.filter(c => c.isThread()).size,
    };

    const verificationLevels = {
      None: 'None',
      Low: 'Low',
      Medium: 'Medium',
      High: 'High',
      VeryHigh: 'Very High',
    };

    const embed = new EmbedBuilder()
      .setTitle(`Server Info: ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 1024 }))
      .addFields(
        { name: 'Server ID', value: guild.id, inline: true },
        { name: 'Owner', value: `${owner.user.tag} (${owner.id})`, inline: true },
        { name: 'Region', value: guild.preferredLocale || 'Unknown', inline: true },

        { name: 'Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
        { name: 'Members', value: `${guild.memberCount}`, inline: true },
        { name: 'Bots', value: `${guild.members.cache.filter(m => m.user.bot).size}`, inline: true },

        { name: 'Channels', value:
          `Text: ${channelCounts.text}\n` +
          `Voice: ${channelCounts.voice}\n` +
          `Categories: ${channelCounts.categories}\n` +
          `Stage: ${channelCounts.stage}\n` +
          `Announcements: ${channelCounts.news}\n` +
          `Threads: ${channelCounts.threads}`,
          inline: true
        },

        { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Emojis', value: `${guild.emojis.cache.size}`, inline: true },
        { name: 'Boost Level', value: `Tier ${guild.premiumTier}`, inline: true },
        { name: 'Boost Count', value: `${guild.premiumSubscriptionCount}`, inline: true },
        { name: 'Verification Level', value: verificationLevels[guild.verificationLevel] || 'Unknown', inline: true },
        { name: 'Features', value: guild.features.length ? guild.features.join(', ') : 'None', inline: false },
      )
      .setColor('Blurple')
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
