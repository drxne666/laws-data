const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = "1467477989863329962"; 

client.once('ready', async () => {
    try {
        const data = JSON.parse(fs.readFileSync('./changelog.json', 'utf8'));
        const channel = await client.channels.fetch(CHANNEL_ID);

        const embed = new EmbedBuilder()
            .setTitle(`🚀 Доступно обновление: v${data.version}`)
            .setColor('#5865F2')
            .setThumbnail('https://ibb.co.com/jP3f0H37') // Твое лого
            .setTimestamp();

        let description = "";

        // Если есть новые функции
        if (data.new && data.new.length > 0) {
            description += `### 🆕 Что нового:\n${data.new.map(i => `> ${i}`).join('\n')}\n\n`;
        }

        // Если есть изменения в текущем функционале
        if (data.changed && data.changed.length > 0) {
            description += `### 🔄 Изменено:\n${data.changed.map(i => `> ${i}`).join('\n')}\n\n`;
        }

        // Если есть исправления багов
        if (data.fixed && data.fixed.length > 0) {
            description += `### 🛠️ Исправления:\n${data.fixed.map(i => `> ${i}`).join('\n')}\n`;
        }

        embed.setDescription(description || "Технические улучшения и оптимизация.");
        embed.setFooter({ text: "Las Vegas Helper • Версия " + data.version });

        await channel.send({ 
            content: "🔔 **Вышла новая версия хелпера!** @everyone", 
            embeds: [embed] 
        });

        console.log(`✅ Обновление ${data.version} опубликовано.`);
        process.exit();
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
});

client.login(TOKEN);
