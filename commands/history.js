const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const file = path.join(__dirname, '..', 'infractions.json');
const hr = process.env.HR_ID;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('View a user\'s infractions')
    .addUserOption(o =>
      o.setName('user')
        .setDescription('User to check')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(i) {
    const m = await i.guild.members.fetch(i.user.id);
    if (!m.roles.cache.has(hr)) {
      return i.reply({ content: '❌ No permission.', ephemeral: true });
    }

    const u = i.options.getUser('user');
    if (!fs.existsSync(file)) {
      return i.reply({ content: '⚠️ No cases found.', ephemeral: true });
    }

    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
      .filter(e => e.userId === u.id);

    if (!data.length) {
      return i.reply({ content: `✅ <@${u.id}> has no infractions.`, ephemeral: true });
    }

    const em = new EmbedBuilder()
      .setTitle(`History for ${u.tag}`)
      .setColor(0xffcc00)
      .setFooter({ text: `Total: ${data.length}` });

    for (const e of data.slice(-10)) {
      em.addFields({
        name: `Case #${e.caseId}`,
        value: [
          `• **Reason:** ${e.reason}`,
          `• **Punishment:** ${e.punishment}`,
          `• **Duration:** ${e.duration}`,
          `• **Notes:** ${e.notes || 'None'}`,
          `• **Voided:** ${e.voided ? '✅' : '❌'}`
        ].join('\n')
      });
    }

    await i.reply({ embeds: [em], ephemeral: true });
  }
};
