// Heaven Eats Advanced Bot
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const config = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = config.prefix;

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const cmd = message.content.slice(PREFIX.length).trim().toLowerCase();

  if (cmd === "tickets") {
    const embed = new EmbedBuilder()
      .setTitle("🍔 Heaven Eats Ordering")
      .setDescription(`Uber Eats - 🟢  
Doordash - 🟢  
Instacart - 🟡 (working on updates)

Click the button below to place your order`)
      .setColor("#ff6600");

    const button = new ButtonBuilder()
      .setCustomId("create_ticket")
      .setLabel("Place Order")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "create_ticket") {

    const existing = interaction.guild.channels.cache.find(
      c => c.name === `order-${interaction.user.id}`
    );

    if (existing) {
      return interaction.reply({
        content: `You already have a ticket: ${existing}`,
        ephemeral: true
      });
    }

    const category = interaction.guild.channels.cache.find(
      c => c.name === config.ticketCategoryName && c.type === ChannelType.GuildCategory
    );

    const chefRole = interaction.guild.roles.cache.find(
      r => r.name === config.chefRoleName
    );

    const channel = await interaction.guild.channels.create({
      name: `order-${interaction.user.id}`,
      type: ChannelType.GuildText,
      parent: category ? category.id : null,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: chefRole.id,
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    await interaction.reply({
      content: `Ticket created: ${channel}`,
      ephemeral: true
    });

    channel.send(`${interaction.user} ${chefRole}`);
  }
});

client.on('messageCreate', async (message) => {
  if (message.content === "..close") {
    if (!message.channel.name.startsWith("order-")) return;

    const chefRole = message.guild.roles.cache.find(
      r => r.name === config.chefRoleName
    );

    if (!message.member.roles.cache.has(chefRole.id)) {
      return message.reply("Only Chefs can close tickets.");
    }

    message.channel.send("Closing...");
    setTimeout(() => message.channel.delete(), 3000);
  }
});

client.login(process.env.TOKEN);
