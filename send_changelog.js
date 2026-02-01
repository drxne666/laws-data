const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = "1467477989863329962"; 

client.once('ready', async () => {
    try {
        const data = JSON.parse(fs.readFileSync('./changelog.json', 'utf8'));
        const channel = await client.channels.fetch(CHANNEL_ID);

        // Формируем список изменений с красивыми буллитами
        const changesList = data.changes.map(item => `${item}`).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`🚀 Новая версия: v${data.version}`)
            .setAuthor({ name: 'Las Vegas Helper | Development' })
            .setDescription(`### Что изменилось в этой версии:\n${changesList}`)
            .setColor('#7289DA') // Красивый Blurple цвет Discord
            .addFields(
                { name: 'Тип обновления', value: `\`${data.type || "Стандартное"}\``, inline: true },
                { name: 'Статус', value: '🟢 Доступно', inline: true }
            )
            .setThumbnail('https://i.imgur.com/v8S7A3P.png') // Сюда можно поставить лого твоего хелпера
            .setFooter({ text: "Обновите приложение для корректной работы всех функций" })
            .setTimestamp();

        await channel.send({ content: "@everyone", embeds: [embed] }); // Пингует всех при обнове
        console.log('✅ Новости опубликованы!');
        process.exit();
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
});

client.login(TOKEN);
