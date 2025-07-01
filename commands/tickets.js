const {
  SlashCommandBuilder,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
require('dotenv').config();

const CAT_ID = '1346192429224820832';
const TRANSCRIPT_CH_ID = '1371239056071069818';
const STAFF_IDS = ['1371248467833393305'];
const STAFF_PING_ROLE = '1371248467833393305';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Support ticket module (admin only)'),

  async execute(i) {
    if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return i.reply({ content: '❌ You must be an admin to use this command.', ephemeral: true });
    }

    const btn = new ButtonBuilder()
      .setCustomId('open_ticket')
      .setLabel('Open a Ticket')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(btn);

    await i.reply({
      content: 'Click below to open a support ticket.',
      components: [row],
    });
  },

  async handleComponent(i) {
    if (i.customId === 'open_ticket') {
      const modal = new ModalBuilder()
        .setTitle('Ticket Reason')
        .setCustomId('ticket_modal')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('reason_input')
              .setLabel('Why are you opening this ticket?')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          )
        );
      return i.showModal(modal);
    }

    if (i.customId === 'claim_ticket') {
      return i.reply({
        content: `✅ ${i.user} has claimed this ticket!`,
        ephemeral: true,
      });
    }

    if (i.customId === 'close_ticket') {
      await i.reply({
        content: `🛑 ${i.user} is closing this ticket. Channel will be deleted in 10 seconds.`,
        ephemeral: false,
      });

      const ch = i.channel;
      const msgs = await ch.messages.fetch({ limit: 100 });
      const sorted = msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      const logDir = path.join(__dirname, '..', 'transcripts');
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

      const txtPath = path.join(logDir, `${ch.name}.txt`);
      const zipPath = path.join(logDir, `${ch.name}.zip`);
      const content = sorted.map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content}`).join('\n');

      fs.writeFileSync(txtPath, content);

      const out = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(out);
      archive.file(txtPath, { name: `${ch.name}.txt` });
      await archive.finalize();

      out.on('close', async () => {
        const logCh = await i.guild.channels.fetch(TRANSCRIPT_CH_ID);
        await logCh.send({
          content: `📁 Transcript for ${ch.name}`,
          files: [zipPath],
        });

        setTimeout(() => {
          fs.unlinkSync(txtPath);
          fs.unlinkSync(zipPath);
          ch.delete().catch(() => {});
        }, 10000);
      });
    }
  },

  async handleModalSubmit(i) {
    if (i.customId !== 'ticket_modal') return;
    const reason = i.fields.getTextInputValue('reason_input');

    const tCh = await i.guild.channels.create({
      name: `ticket-${i.user.username}`,
      type: ChannelType.GuildText,
      parent: CAT_ID,
      permissionOverwrites: [
        {
          id: i.guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        ...STAFF_IDS.map(id => ({
          id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        })),
        {
          id: i.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });

    const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setTitle('**Support Ticket - servername**')
      .setDescription(
        'Thank you for contacting the Team. We will have an official handle this ticket shortly.\n\nUntil then, please **DO NOT ping any staff.**'
      );

    const btns = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger)
    );

    await tCh.send({
      content: `<@${i.user.id}> <@&${STAFF_PING_ROLE}>`,
      embeds: [embed],
      components: [btns],
    });

    await tCh.send(`🔔 Ticket Creation Reason:\n\`\`\`${reason}\`\`\``);

    await i.reply({
      content: `🎟️ Ticket created: ${tCh}`,
      ephemeral: true,
    });
  },
};
