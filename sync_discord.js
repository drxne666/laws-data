const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const TOKEN = process.env.DISCORD_TOKEN;
const DATA_FILE = './rules.json';

// Карта каналов: Тег из JSON -> ID канала в Discord
const CHANNEL_MAP = {
    "Основные правила проекта": "1467200553149796403",
    "Правила игровых зон": "1467200617947599031",
    "Правила ограблений и похищений": "1467200633638490417",
    "Правила для лидеров фракций": "1467200649618919687",
    "Правила нападения / обороны острова Кайо-Перико": "1467200667134332950",
    "Общие правила семейных организаций": "1467200681579512101",
    "Правила проведения игровых захватов / терактов": "1467200697400426536",
    "Правила нападения / обороны территории Форта-Занкудо": "1467200712139210966",
    "Правила перехвата поставок": "1467200732166885428",
    "Правила войны за AirDrop": "1467200749422252205",
    "Правила ограбления бизнесов": "1467200777998041287",
    "Правила ограбления банков": "1467200793894453435",
    "Правила захвата цехов / дилеров": "1467200815222751333",
    "Правила военного положения": "1467200835271524640",
    "Правила рейдов": "1467200852056866827",
    "Правила государственных организаций": "1467200870973178023",
    "Правила криминальных организаций": "1467200893496856912",
    "Правила войны за территорию": "1467200912689860771",
    "Правила войны за материалы": "1467200928271827077"
};

client.once('clientReady', async () => {
    console.log(`✅ Бот запущен: ${client.user.tag}`);
    
    try {
        const rulesData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const sections = {};

        // Сортируем правила по категориям
        rulesData.forEach(rule => {
            const tag = rule.tag?.trim();
            if (CHANNEL_MAP[tag]) {
                if (!sections[tag]) sections[tag] = [];
                sections[tag].push(rule);
            }
        });

        for (const [tagName, rules] of Object.entries(sections)) {
            const channelId = CHANNEL_MAP[tagName];
            const channel = await client.channels.fetch(channelId);
            
            console.log(`📡 Обработка канала: ${tagName}`);

            let chunks = [];
            let currentChunk = "";

            rules.forEach(r => {
                let ruleText = `**${r.title} ${r.name || ''}**\n${r.text}\n`;
                if (r.exception) ruleText += `> **Исключение:** ${r.exception}\n`;
                if (r.note) ruleText += `> **Примечание:** ${r.note}\n`;
                if (r.punish) ruleText += `**Наказание:** ${r.punish}\n`;
                ruleText += '\n---\n';

                if ((currentChunk + ruleText).length > 3900) {
                    chunks.push(currentChunk);
                    currentChunk = ruleText;
                } else {
                    currentChunk += ruleText;
                }
            });
            chunks.push(currentChunk);

            const messages = await channel.messages.fetch({ limit: 50 });
            const botMessages = Array.from(messages.filter(m => m.author.id === client.user.id).values()).reverse();

            for (let i = 0; i < chunks.length; i++) {
                const footerId = `Sync ID: ${tagName} | Part: ${i + 1}`;
                const embed = new EmbedBuilder()
                    .setTitle(`📌 ${tagName}`)
                    .setDescription(chunks[i])
                    .setColor('#e0015b')
                    .setFooter({ text: footerId });

                const existingMsg = botMessages.find(m => m.embeds[0]?.footer?.text === footerId);

                if (existingMsg) {
                    await existingMsg.edit({ embeds: [embed] });
                    console.log(`  ✅ Обновлено: ${footerId}`);
                } else {
                    await channel.send({ embeds: [embed] });
                    console.log(`  ✨ Создано: ${footerId}`);
                }
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        console.log('🚀 Полная синхронизация завершена!');
        process.exit();
    } catch (error) {
        console.error('❌ Ошибка синхронизации:', error);
        process.exit(1);
    }
});

client.login(TOKEN);
