const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { parse } = require('csv-parse/sync');
const { readFileSync } = require('node:fs');
const fs = require('fs');
const { join } = require('node:path');

const ksData = parse(readFileSync(path.join(__dirname, 'export.csv'), 'utf-8'), {
	columns: true,
	skip_empty_lines: true,
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('claim')
		.setDescription('Claim your status based on Kickstarter pledge on Teamcrafter')
		.addStringOption(option => option.setName('email').setDescription('Email used for your Kickstarter account').setRequired(true)),
	async execute(interaction) {
		const member = await interaction.guild.members.fetch(interaction.user.id);
		member.roles.add('1395767247909163101');
		const email = interaction.options.getString('email');
		const ksEntry = ksData.find(row => row.Email.toLowerCase() === email.toLowerCase());
		console.log(ksEntry);
		if (ksEntry && ksEntry['Pledged status'] === 'collected') {
			const claimedPath = join(__dirname, '../claimed.json');
			const claimed = JSON.parse(fs.readFileSync(claimedPath, 'utf8') || '[]');
			if (claimed.includes(email)) {
				await interaction.reply({
					embeds: [
						new MessageEmbed()
							.setTitle('Claim failed')
							.setColor('CRIMSON')
							.setDescription('Your email has already been claimed'),
					],
					ephemeral: true,
				});
			}
			else {
				const isBackerRole = ksEntry['"Backer" Discord role'] === '1';
				const isSuperbackerRole = ksEntry['"Superbacker" Discord role'] === '1';
				if (isBackerRole) {
					member.roles.add('1412713242526224436');
				}
				if (isSuperbackerRole) {
					member.roles.add('1412713090155548742');
				}
				claimed.push(email);
				fs.writeFileSync(claimedPath, JSON.stringify(claimed));
				await interaction.reply({
					embeds: [
						new MessageEmbed()
							.setTitle('Kickstarter roles claimed')
							.setColor('GREEN')
							.setDescription('Roles have been assigned successfully'),
					],
					ephemeral: true,
				});
			}
		}
		else {
			await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setTitle('Claim failed')
						.setColor('CRIMSON')
						.setDescription('Your profile does not appear in our Backers list, please contact devs if you think it\'s a mistake.'),
				],
				ephemeral: true,
			});
		}
		await interaction.remove;
	},
};
