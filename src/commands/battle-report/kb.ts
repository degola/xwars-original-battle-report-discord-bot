/** SlashCommand /kb definition and execution
 *
 * Usage:
 *
 *   /kb <url> <private=True|False> <format=text|oneline>
 *
 * Accepts a battle report url and publishs it anonymised to the #battle-report channel.
 * Optional parameters:
 *  - private: If True, report will not be published but sent as private message
 *  - format: Sets report message format
 */
import "dotenv/config";

const DEBUG = process.env.DEBUG || false;
const REPORT_URL_BASE =
  process.env.REPORT_URL_BASE || "https://kb.original.xwars.net/";

import { Command } from "../../command";

import * as parser from "../../parser";
import * as message from "../../message";

import { GuildConfigStorage } from "../../guild-config-storage";
const config = new GuildConfigStorage();

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";

const builder = new SlashCommandBuilder();
builder
  .setName("kb")
  .setDescription(
    "Accepts a battle report url and publishs it anonymised to the #battle-report channel."
  )
  .setDMPermission(false)
  .addStringOption((option) =>
    option.setName("url").setDescription("battle report url").setRequired(true)
  )
  .addBooleanOption((option) =>
    option
      .setName("private")
      .setDescription("send the battle report just as private response")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("format")
      .addChoices(
        { name: "text", value: "text" },
        { name: "oneline", value: "oneline" }
      )
      .setDescription("message format options: text, oneline")
      .setRequired(false)
  );

const command = async (
  interaction: ChatInputCommandInteraction
): Promise<void> => {
  const reportUrl = interaction.options.get("url")?.value?.toString();
  if (reportUrl == undefined) {
    throw new Error("no report url");
  }

  const pmOnlyOption = interaction.options.get("private");
  let pmOnly = false;
  if (pmOnlyOption) {
    if (pmOnlyOption && pmOnlyOption.value === true) pmOnly = true;
  }

  const guild = interaction.guild;
  if (guild == undefined) {
    throw new Error("no guild found");
  }

  const format =
    interaction.options.get("format")?.value?.toString() ||
    (await config.getValue(guild.id, "default_format_user")) ||
    "text";

  try {
    const { reportId, data, fleetData } = await parser.parseReport(reportUrl);
    const finalReportUrl = [REPORT_URL_BASE, reportId].join("");

    const { text, embed } = message.createMessage(
      format,
      data,
      fleetData,
      finalReportUrl,
      interaction.user.toString()
    );

    console.log(
      "shared report url",
      reportUrl,
      "as",
      finalReportUrl,
      "pm-only?",
      pmOnly
    );
    if (DEBUG || pmOnly) {
      interaction.reply({
        content: text,
        embeds: embed ? [embed] : undefined,
        ephemeral: true,
      });
      return;
    }

    const cache = guild.channels.cache;
    if (cache == undefined) {
      throw Error("no channels found");
    }
    const channel = cache.find((channel) =>
      channel.name.match(/battle-reports/)
    );
    if (channel == undefined) {
      throw new Error("batte reports channel not found");
    }
    if (channel instanceof TextChannel) {
      await channel.send({
        content: text,
        embeds: embed ? [embed] : undefined,
      });
    }
    await interaction.reply({
      content: `Battle report shared as ${finalReportUrl} in channel ${channel.toString()}`,
      ephemeral: true,
    });
  } catch (e) {
    if (e instanceof parser.ParseError) {
      interaction.reply({
        content: e.message,
        ephemeral: true,
      });
      return;
    } else {
      throw e;
    }
  }
};

module.exports = new Command(builder, command);
