const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const DATA_FILE = './rules.json';

client.once('clientReady', async () => {
    console.log(`✅ Бот авторизован: ${client.user.tag}`);
    
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        const rulesData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

        const sections = {};
        rulesData.forEach(rule => {
            const tag = rule.tag || "Без категории";
            if (!sections[tag]) sections[tag] = [];
            sections[tag].push(rule);
        });

        const messages = await channel.messages.fetch({ limit: 50 });
        const botMessages = messages.filter(m => m.author.id === client.user.id);

        for (const [tagName, rules] of Object.entries(sections)) {
            let content = '';
            
            rules.forEach(r => {
                // Заголовок правила (например, 1.2 Общее положение)
                content += `**${r.title} ${r.name || ''}**\n`;
                
                // Основной текст
                content += `${r.text}\n`;

                // Исключение
                if (r.exception) {
                    content += `> **Исключение:** ${r.exception}\n`;
                }

                // Примечание
                if (r.note) {
                    content += `> **Примечание:** ${r.note}\n`;
                }

                // Наказание (выделяем жирным и отдельной строкой)
                if (r.punish) {
                    content += `**Наказание:** ${r.punish}\n`;
                }

                content += '\n'; // Отступ между правилами
            });

            if (content.length > 4000) content = content.substring(0, 3990) + '...';

            const embed = new EmbedBuilder()
                .setTitle(`📌 ${tagName}`)
                .setDescription(content)
                .setColor('#e0015b') // Твой фирменный розовый
                .setFooter({ text: `Helper Sync • ${new Date().toLocaleString('ru-RU')}` });

            const existingMsg = botMessages.find(m => m.embeds[0]?.title === `📌 ${tagName}`);

            if (existingMsg) {
                console.log(`🔄 Обновляю: ${tagName}`);
                await existingMsg.edit({ embeds: [embed] });
            } else {
                console.log(`✨ Создаю: ${tagName}`);
                await channel.send({ embeds: [embed] });
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        console.log('🚀 Синхронизация завершена!');
        process.exit();

    } catch (error) {
        console.error('❌ Произошла ошибка:', error);
        process.exit(1);
    }
});

client.login(TOKEN);
