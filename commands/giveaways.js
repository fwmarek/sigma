const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder
} = require('discord.js');
require('dotenv').config();

const active = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways')
    .addSubcommand(cmd =>
      cmd
        .setName('create')
        .setDescription('Start a giveaway')
        .addStringOption(o => o.setName('prize').setDescription('Prize').setRequired(true))
        .addStringOption(o => o.setName('duration').setDescription('e.g. 10m, 1h, 2d').setRequired(true))
        .addIntegerOption(o => o.setName('winners').setDescription('Winner count').setRequired(true))
        .addChannelOption(o => o.setName('channel').setDescription('Where to post it').setRequired(true))
        .addBooleanOption(o => o.setName('ping').setDescription('Ping everyone?').setRequired(true))
    ),

  async execute(i) {
    const role = process.env.HR_ID;
    if (!i.member.roles.cache.has(role)) {
      return i.reply({ content: 'No permission.', ephemeral: true });
    }

    if (i.options.getSubcommand() !== 'create') return;

    const prize = i.options.getString('prize');
    const dur = i.options.getString('duration');
    const count = i.options.getInteger('winners');
    const ch = i.options.getChannel('channel');
    const ping = i.options.getBoolean('ping');

    const ms = parseDur(dur);
    if (!ms) return i.reply({ content: 'Bad duration. Use 10m, 1h, 2d.', ephemeral: true });

    const id = `${ch.id}-${Date.now()}`;
    const btn = new ButtonBuilder()
      .setCustomId(`join-${id}`)
      .setLabel('Join Giveaway (0)')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(btn);

    const em = new EmbedBuilder()
      .setTitle(`🎉 ${prize}`)
      .setDescription([
        'Click below to join!',
        `**Ends:** <t:${Math.floor((Date.now() + ms) / 1000)}:R>`,
        `**Winners:** ${count}`
      ].join('\n'))
      .setColor('Gold')
      .setFooter({ text: `Hosted by ${i.user.tag}` });

    const msg = await ch.send({
      content: ping ? '@everyone' : null,
      embeds: [em],
      components: [row]
    });

    i.reply({ content: `Giveaway started in ${ch}!`, ephemeral: true });

    const users = new Set();
    active.set(id, users);

    const col = msg.createMessageComponentCollector({
      time: ms,
      filter: b => b.customId === `join-${id}`
    });

    col.on('collect', async b => {
      if (users.has(b.user.id)) {
        await b.reply({ content: 'Already joined.', ephemeral: true });
      } else {
        users.add(b.user.id);
        const newBtn = ButtonBuilder.from(btn).setLabel(`Join Giveaway (${users.size})`);
        const newRow = new ActionRowBuilder().addComponents(newBtn);
        await msg.edit({ components: [newRow] });
        await b.reply({ content: 'You joined!', ephemeral: true });
      }
    });

    col.on('end', async () => {
      const pool = Array.from(users);
      if (pool.length === 0) {
        msg.reply('Nobody joined.');
        return;
      }

      const win = pick(pool, count);
      const tags = win.map(id => `<@${id}>`).join(', ');
      msg.reply(`🎉 Congrats ${tags}! You won **${prize}**!`);
    });
  }
};

function parseDur(txt) {
  const m = txt.match(/^(\d+)([smhd])$/);
  if (!m) return null;
  const n = parseInt(m[1]);
  const u = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 };
  return n * u[m[2]];
}

function pick(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}
