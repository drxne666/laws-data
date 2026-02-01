const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent 
    ] 
});

const TOKEN = process.env.DISCORD_TOKEN;
const LOG_CHANNEL_ID = "ТВОЙ_ID_КАНАЛА_ЛОГОВ"; // Укажи ID канала для отчетов

// Общая карта каналов (Правила + Законы)
const CHANNEL_MAP = {
    // Правила
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
    "Правила войны за материалы": "1467200928271827077",
    
    // Законы
    "Уголовный": "1467466642861719767",
    "Административный": "1467466684393853077",
    "Дорожный": "1467466715511394470",
    "Процессуальный": "1467466760511815897"
};

const lawPrefixes = {
    "Уголовный": "УК",
    "Административный": "АК",
    "Дорожный": "ДК",
    "Процессуальный": "ПК"
};

client.once('ready', async () => {
    console.log(`✅ Бот запущен: ${client.user.tag}`);
    const stats = { updated: 0, created: 0, deleted: 0 };
    const startTime = Date.now();

    try {
        // Загружаем данные из обоих файлов
        const rulesData = JSON.parse(fs.readFileSync('./rules.json', 'utf8'));
        const lawsData = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
        
        // Объединяем в один массив для обработки
        const allData = [...rulesData, ...lawsData];
        const sections = {};

        allData.forEach(item => {
            const tag = item.category || item.tag; // Для законов используем category
            if (CHANNEL_MAP[tag]) {
                if (!sections[tag]) sections[tag] = [];
                sections[tag].push(item);
            }
        });

        for (const [tagName, items] of Object.entries(sections)) {
            const channelId = CHANNEL_MAP[tagName];
            const channel = await client.channels.fetch(channelId);
            const isLaw = !!lawPrefixes[tagName];
            
            console.log(`📡 Синхронизация: ${tagName}`);

            let chunks = [];
            let currentChunk = "";

            items.forEach(item => {
                const prefix = isLaw ? lawPrefixes[tagName] : "";
                let itemText = `**${prefix} ${item.title} ${item.name || ''}**\n${item.text}\n`;
                
                if (item.exception) itemText += `> **Исключение:** ${item.exception}\n`;
                if (item.note) itemText += `> **Примечание:** ${item.note}\n`;
                if (item.punish) itemText += `**Наказание:** ${item.punish}\n`;
                itemText += '\n---\n';

                if ((currentChunk + itemText).length > 3900) {
                    chunks.push(currentChunk);
                    currentChunk = itemText;
                } else {
                    currentChunk += itemText;
                }
            });
            chunks.push(currentChunk);

            const messages = await channel.messages.fetch({ limit: 50 });
            const botMessages = Array.from(messages.filter(m => m.author.id === client.user.id).values()).reverse();

            for (let i = 0; i < chunks.length; i++) {
                const footerId = `Sync ID: ${tagName} | Part: ${i + 1}`;
                const embed = new EmbedBuilder()
                    .setTitle(isLaw ? `⚖️ ${tagName} Кодекс` : `📌 ${tagName}`)
                    .setDescription(chunks[i])
                    .setColor(isLaw ? '#2f3136' : '#e0015b')
                    .setFooter({ text: footerId });

                const existingMsg = botMessages.find(m => m.embeds[0]?.footer?.text === footerId);

                if (existingMsg) {
                    if (existingMsg.embeds[0].description !== chunks[i]) {
                        await existingMsg.edit({ embeds: [embed] });
                        stats.updated++;
                    }
                } else {
                    await channel.send({ embeds: [embed] });
                    stats.created++;
                }
                await new Promise(r => setTimeout(r, 800));
            }

            // Удаление старых частей
            const currentPartIds = chunks.map((_, i) => `Sync ID: ${tagName} | Part: ${i + 1}`);
            const extraMessages = botMessages.filter(m => 
                m.embeds[0]?.footer?.text?.startsWith(`Sync ID: ${tagName}`) && 
                !currentPartIds.includes(m.embeds[0]?.footer?.text)
            );

            for (const extra of extraMessages) {
                await extra.delete();
                stats.deleted++;
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
        const logEmbed = new EmbedBuilder()
            .setTitle('🔄 Глобальная синхронизация завершена')
            .setDescription('Обновлены правила и кодексы.')
            .addFields(
                { name: '✨ Новые части', value: `${stats.created}`, inline: true },
                { name: '✅ Обновлено', value: `${stats.updated}`, inline: true },
                { name: '🗑️ Удалено', value: `${stats.deleted}`, inline: true }
            )
            .setFooter({ text: `Время: ${duration}с` })
            .setTimestamp()
            .setColor('#00ff00');

        await logChannel.send({ embeds: [logEmbed] });
        process.exit();

    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
});

client.login(TOKEN);
