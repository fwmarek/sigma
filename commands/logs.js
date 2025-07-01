const {
  EmbedBuilder,
  AuditLogEvent,
  Events,
  ChannelType,
} = require('discord.js');

const logChannelId = process.env.LOG_CH_ID;

module.exports = client => {
  const createEmbed = (title, desc, color = 'Blurple') =>
    new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color).setTimestamp();

  const sendLog = (embed) => {
    const ch = client.channels.cache.get(logChannelId);
    if (!ch || !ch.isTextBased()) return;
    ch.send({ embeds: [embed] }).catch(() => {});
  };

  client.on(Events.GuildBanAdd, async ban => {
    const logs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
    const log = logs.entries.first();
    if (!log) return;
    const { executor, reason } = log;
    sendLog(createEmbed(
      '🔨 Ban',
      `**User:** ${ban.user.tag} (${ban.user.id})\n**By:** ${executor?.tag || 'Unknown'}\n**Reason:** ${reason || 'None'}`
    ));
  });

  client.on(Events.GuildBanRemove, async unban => {
    const logs = await unban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 });
    const log = logs.entries.first();
    if (!log) return;
    const { executor, reason } = log;
    sendLog(createEmbed(
      '⚖️ Unban',
      `**User:** ${unban.user.tag} (${unban.user.id})\n**By:** ${executor?.tag || 'Unknown'}\n**Reason:** ${reason || 'None'}`
    ));
  });

  client.on(Events.GuildMemberRemove, async member => {
    const logs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 });
    const log = logs.entries.first();
    const kicked = log?.target?.id === member.id;
    sendLog(createEmbed(
      kicked ? '👢 Kick' : '📤 Leave',
      kicked
        ? `**User:** ${member.user.tag} (${member.user.id})\n**By:** ${log.executor?.tag || 'Unknown'}\n**Reason:** ${log.reason || 'None'}`
        : `**${member.user.tag}** left.`
    ));
  });

  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const changes = [];

    if (oldMember.communicationDisabledUntil !== newMember.communicationDisabledUntil) {
      const logs = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 1 });
      const log = logs.entries.first();
      const { executor, reason } = log || {};
      const until = newMember.communicationDisabledUntilTimestamp;
      sendLog(createEmbed(
        until && until > Date.now() ? '⏱️ Timeout' : '🔓 Timeout Removed',
        `**User:** ${newMember.user.tag}\n` +
        `${until && until > Date.now() ? `**Until:** <t:${Math.floor(until / 1000)}:F>\n` : ''}` +
        `**By:** ${executor?.tag || 'Unknown'}\n` +
        `**Reason:** ${reason || 'None'}`
      ));
    }

    if (oldMember.nickname !== newMember.nickname) {
      changes.push(`**Nick:** \`${oldMember.nickname || 'None'}\` → \`${newMember.nickname || 'None'}\``);
    }

    const addedRoles = [...newMember.roles.cache.keys()].filter(r => !oldMember.roles.cache.has(r));
    const removedRoles = [...oldMember.roles.cache.keys()].filter(r => !newMember.roles.cache.has(r));
    if (addedRoles.length) changes.push(`**+Roles:** ${addedRoles.map(id => `<@&${id}>`).join(', ')}`);
    if (removedRoles.length) changes.push(`**–Roles:** ${removedRoles.map(id => `<@&${id}>`).join(', ')}`);

    if (changes.length) {
      sendLog(createEmbed(`🔁 Update: ${newMember.user.tag}`, changes.join('\n')));
    }
  });

  client.on(Events.MessageDelete, msg => {
    if (msg.partial || !msg.guild || msg.author?.bot) return;
    sendLog(createEmbed(
      '🗑️ Deleted',
      `**By:** ${msg.author.tag}\n**Channel:** <#${msg.channelId}>\n\`\`\`\n${msg.content || 'None'}\n\`\`\``
    ));
  });

  client.on(Events.MessageUpdate, (oldMsg, newMsg) => {
    if (oldMsg.partial || newMsg.partial || !oldMsg.guild || oldMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;
    sendLog(createEmbed(
      '✏️ Edited',
      `**By:** ${oldMsg.author.tag}\n**Channel:** <#${oldMsg.channelId}>\n` +
      `**Before:**\n\`\`\`\n${oldMsg.content}\n\`\`\`\n` +
      `**After:**\n\`\`\`\n${newMsg.content}\n\`\`\``
    ));
  });

  client.on(Events.MessageBulkDelete, msgs => {
    const guild = msgs.first()?.guild;
    if (!guild) return;
    sendLog(createEmbed(
      '📦 Bulk Delete',
      `${msgs.size} messages in <#${msgs.first().channelId}>`
    ));
  });

  client.on(Events.ChannelCreate, channel => {
    sendLog(createEmbed(
      '📁 Channel Created',
      `**Name:** ${channel.name}\n**Type:** ${ChannelType[channel.type]}`
    ));
  });

  client.on(Events.ChannelDelete, channel => {
    sendLog(createEmbed(
      '🗑️ Channel Deleted',
      `**Name:** ${channel.name}`
    ));
  });

  client.on(Events.ChannelUpdate, (oldChannel, newChannel) => {
    const changes = [];
    if (oldChannel.name !== newChannel.name) changes.push(`**Name:** \`${oldChannel.name}\` → \`${newChannel.name}\``);
    if (changes.length) sendLog(createEmbed('🔁 Channel Updated', changes.join('\n')));
  });

  client.on(Events.GuildRoleCreate, role => {
    sendLog(createEmbed(
      '➕ Role Created',
      `**Name:** <@&${role.id}>`
    ));
  });

  client.on(Events.GuildRoleDelete, role => {
    sendLog(createEmbed(
      '➖ Role Deleted',
      `**Name:** ${role.name}`
    ));
  });

  client.on(Events.GuildRoleUpdate, (oldRole, newRole) => {
    const changes = [];
    if (oldRole.name !== newRole.name) changes.push(`**Name:** \`${oldRole.name}\` → \`${newRole.name}\``);
    if (changes.length) sendLog(createEmbed('🔁 Role Updated', changes.join('\n')));
  });

  client.on(Events.GuildEmojiCreate, emoji => {
    sendLog(createEmbed(
      '😀 Emoji Created',
      `**Name:** ${emoji.name}`
    ));
  });

  client.on(Events.GuildEmojiDelete, emoji => {
    sendLog(createEmbed(
      '❌ Emoji Deleted',
      `**Name:** ${emoji.name}`
    ));
  });

  client.on(Events.GuildStickerCreate, sticker => {
    sendLog(createEmbed(
      '🏷️ Sticker Created',
      `**Name:** ${sticker.name}`
    ));
  });

  client.on(Events.GuildUpdate, (oldGuild, newGuild) => {
    const changes = [];
    if (oldGuild.name !== newGuild.name) changes.push(`**Name:** \`${oldGuild.name}\` → \`${newGuild.name}\``);
    if (changes.length) sendLog(createEmbed('🏠 Server Updated', changes.join('\n')));
  });

  client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const user = newState.member?.user || oldState.member?.user;
    if (!user) return;

    const changes = [];

    if (!oldState.channelId && newState.channelId)
      changes.push(`🔊 **Joined:** <#${newState.channelId}>`);
    else if (oldState.channelId && !newState.channelId)
      changes.push(`🔇 **Left:** <#${oldState.channelId}>`);
    else if (oldState.channelId !== newState.channelId)
      changes.push(`🔁 **Switched:** <#${oldState.channelId}> → <#${newState.channelId}>`);

    if (oldState.selfMute !== newState.selfMute)
      changes.push(`🎙️ **Self Mute:** \`${newState.selfMute}\``);
    if (oldState.selfDeaf !== newState.selfDeaf)
      changes.push(`🔇 **Self Deaf:** \`${newState.selfDeaf}\``);

    if (changes.length)
      sendLog(createEmbed(`🎧 VC Update: ${user.tag}`, changes.join('\n')));
  });
};
