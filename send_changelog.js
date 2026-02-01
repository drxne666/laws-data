const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = "1467477989863329962"; 

// Сюда вставь прямую ссылку на твой логотип с GitHub
const LOGO_URL = "https://raw.githubusercontent.com/drxne666/laws-data/main/icon.png";

client.once('ready', async () => {
    try {
        const data = JSON.parse(fs.readFileSync('./changelog.json', 'utf8'));
        const channel = await client.channels.fetch(CHANNEL_ID);

        const embed = new EmbedBuilder()
            .setTitle(`🚀 Доступно обновление: v${data.version}`)
            .setColor('#5865F2')
            .setThumbnail(LOGO_URL) // Используем твою новую ссылку
            .setTimestamp();

        let description = "";

        if (data.new && data.new.length > 0) {
            description += `**─── 🆕 ЧТО НОВОГО ───**\n${data.new.map(i => `> ${i}`).join('\n')}\n\n`;
        }

        if (data.changed && data.changed.length > 0) {
            description += `**─── 🔄 ИЗМЕНЕНО ───**\n${data.changed.map(i => `> ${i}`).join('\n')}\n\n`;
        }

        if (data.fixed && data.fixed.length > 0) {
            description += `**─── 🛠️ ИСПРАВЛЕНИЯ ───**\n${data.fixed.map(i => `> ${i}`).join('\n')}\n`;
        }

        embed.setDescription(description || "Технические улучшения и оптимизация.");
        embed.setFooter({ text: `Las Vegas Helper • Версия ${data.version} • Сегодня` });

        await channel.send({ 
            content: "🔔 **Вышла новая версия хелпера!** @everyone", 
            embeds: [embed] 
        });

        console.log(`✅ Обновление ${data.version} успешно отправлено.`);
        process.exit();
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
});

client.login(TOKEN);
