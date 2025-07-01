const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

const ERLC_API_KEY = process.env.ERLC_API_KEY;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('erlc')
    .setDescription('Get info about the private ERLC server')
    .addSubcommand(sub =>
      sub.setName('info')
        .setDescription('Displays ERLC server member and queue info')
    ),

  async execute(interaction) {
    let membersInGame = 0;
    let staffInGame = 0;
    let queue = 0;
    let ephemeralWarning = false;

    if (!ERLC_API_KEY || ERLC_API_KEY === 'n/a_for_now') {
      ephemeralWarning = true;
    } else {
      try {
        await interaction.deferReply();

        const res = await fetch(`https://api.policeroleplay.community/v1/status?key=${ERLC_API_KEY}`);
        if (res.ok) {
          const data = await res.json();
          membersInGame = data.membersInGame ?? 0;
          staffInGame = data.staffInGame ?? 0;
          queue = data.queue ?? 0;
        }
      } catch (error) {
        console.error(error);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`ERLC Server Info`)
      .setColor('Blue')
      .addFields(
        { name: 'Members Ingame', value: membersInGame.toString(), inline: true },
        { name: 'Staff Members Ingame', value: staffInGame.toString(), inline: true },
        { name: 'Queue', value: queue.toString(), inline: true },
      )
      .setTimestamp();

    if (ephemeralWarning) {
      await interaction.reply({ content: '⚠️ ERLC API key not set. Showing default values.', ephemeral: true });
      await interaction.followUp({ embeds: [embed], ephemeral: false });
    } else {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed] });
      }
    }
  }
};
