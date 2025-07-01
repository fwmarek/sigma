const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  Events
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'infractions.json');
const HR_ROLE_ID = process.env.HR_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('case-status')
    .setDescription('Check and toggle case status (void/unvoid)')
    .addIntegerOption(opt =>
      opt.setName('case_id')
        .setDescription('Case ID to look up')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(HR_ROLE_ID)) {
      return interaction.reply({ content: '❌ You do not have permission.', ephemeral: true });
    }

    const caseId = interaction.options.getInteger('case_id');

    if (!fs.existsSync(filePath)) {
      return interaction.reply({ content: '❌ No cases found.', ephemeral: true });
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return interaction.reply({ content: '❌ Failed to read case data.', ephemeral: true });
    }

    const inf = data.find(c => c.caseId === caseId);
    if (!inf) {
      return interaction.reply({ content: `❌ Case #${caseId} not found.`, ephemeral: true });
    }

    const now = Date.now();
    const expTimestamp = inf.durationTimestamp || 0;
    const expired = expTimestamp > 0 && now > expTimestamp;

    const status = inf.voided ? 'Voided' : expired ? 'Expired' : 'Active';

    const embed = new EmbedBuilder()
      .setTitle(`📄 Case #${inf.caseId}`)
      .setColor(inf.voided ? 0xff0000 : expired ? 0xffc107 : 0x2ecc71)
      .setDescription(
        `**User:** <@${inf.userId}>\n` +
        `**Reason:** ${inf.reason}\n` +
        `**Punishment:** ${inf.punishment}\n` +
        `**Duration:** ${inf.duration || 'Permanent/Not Set'}\n` +
        `**Notes:** ${inf.notes || 'None'}\n` +
        `**Status:** ${status}`
      );

    const btn = new ButtonBuilder()
      .setCustomId(`voidcase_${caseId}`)
      .setLabel(inf.voided ? 'Unvoid Case' : 'Void Case')
      .setStyle(inf.voided ? ButtonStyle.Success : ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(btn);

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },

  async handleButton(interaction) {
    if (!interaction.customId.startsWith('voidcase_')) return;

    if (!interaction.member.roles.cache.has(HR_ROLE_ID)) {
      return interaction.reply({ content: '❌ You do not have permission.', ephemeral: true });
    }

    const caseIdStr = interaction.customId.split('_')[1];
    const caseId = parseInt(caseIdStr, 10);

    if (isNaN(caseId)) {
      return interaction.reply({ content: '❌ Invalid case ID.', ephemeral: true });
    }

    if (!fs.existsSync(filePath)) {
      return interaction.reply({ content: '❌ No cases found.', ephemeral: true });
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return interaction.reply({ content: '❌ Failed to read case data.', ephemeral: true });
    }

    const inf = data.find(c => c.caseId === caseId);
    if (!inf) {
      return interaction.reply({ content: `❌ Case #${caseId} not found.`, ephemeral: true });
    }

    inf.voided = !inf.voided;

    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch {
      return interaction.reply({ content: '❌ Failed to update case data.', ephemeral: true });
    }

    const now = Date.now();
    const expTimestamp = inf.durationTimestamp || 0;
    const expired = expTimestamp > 0 && now > expTimestamp;
    const status = inf.voided ? 'Voided' : expired ? 'Expired' : 'Active';

    const embed = new EmbedBuilder()
      .setTitle(`📄 Case #${inf.caseId}`)
      .setColor(inf.voided ? 0xff0000 : expired ? 0xffc107 : 0x2ecc71)
      .setDescription(
        `**User:** <@${inf.userId}>\n` +
        `**Reason:** ${inf.reason}\n` +
        `**Punishment:** ${inf.punishment}\n` +
        `**Duration:** ${inf.duration || 'Permanent/Not Set'}\n` +
        `**Notes:** ${inf.notes || 'None'}\n` +
        `**Status:** ${status}`
      );

    const btn = new ButtonBuilder()
      .setCustomId(`voidcase_${caseId}`)
      .setLabel(inf.voided ? 'Unvoid Case' : 'Void Case')
      .setStyle(inf.voided ? ButtonStyle.Success : ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(btn);

    await interaction.update({
      embeds: [embed],
      components: [row],
      content: `✅ Case #${caseId} has been ${inf.voided ? 'voided' : 'unvoided'}.`
    });
  }
};
