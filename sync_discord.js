const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const DATA_FILE = './rules.json';

client.once('ready', async () => {
    console.log(`✅ Бот авторизован: ${client.user.tag}`);
    const channel = await client.channels.fetch(CHANNEL_ID);
    
    if (!fs.existsSync(DATA_FILE)) {
        console.error("❌ Файл rules.json не найден!");
        process.exit(1);
    }

    const rulesData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    // Группируем по тегам
    const sections = {};
    rulesData.forEach(rule => {
        const tag = rule.tag || "Без категории";
        if (!sections[tag]) sections[tag] = [];
        sections[tag].push(rule);
    });

    // Получаем последние 50 сообщений бота в канале
    const messages = await channel.messages.fetch({ limit: 50 });
    const botMessages = messages.filter(m => m.author.id === client.user.id);

    for (const [tagName, rules] of Object.entries(sections)) {
        let content = '';
        rules.forEach(r => {
            content += `**${r.title} ${r.name || ''}**\n${r.text}\n`;
            if (r.punish) content += `*Наказание:* \`${r.punish}\`\n`;
            content += '---'; // Разделитель между пунктами
        });

        // Лимит Discord на описание в Embed — 4096 символов
        if (content.length > 4000) content = content.substring(0, 3990) + '...';

        const embed = new EmbedBuilder()
            .setTitle(`📌 Раздел: ${tagName}`)
            .setDescription(content)
            .setColor('#e0015b')
            .setFooter({ text: `Helper Sync • ${new Date().toLocaleString('ru-RU')}` });

        // Ищем старое сообщение именно этого раздела
        const existingMsg = botMessages.find(m => m.embeds[0]?.title === `📌 Раздел: ${tagName}`);

        if (existingMsg) {
            console.log(`🔄 Обновляю раздел: ${tagName}`);
            await existingMsg.edit({ embeds: [embed] });
        } else {
            console.log(`✨ Создаю новый раздел: ${tagName}`);
            await channel.send({ embeds: [embed] });
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500)); // Защита от спам-фильтра
    }

    console.log('🚀 Синхронизация успешно завершена!');
    process.exit();
});

client.login(TOKEN);
