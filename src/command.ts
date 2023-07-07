/**
 * Interface to the bots slash commands.
 */

import {
    Collection,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
} from "discord.js"

import fs from "node:fs"

/**
 * Represents a slash command. Consists of a SlashCommandBuilder used to
 * deploy the command and a function to execute the command. Each command
 * file must export a instance of this class.
 */
export class Command {
    /** The SlashCommandBuilder used to deploy the command */
    data: SlashCommandBuilder
    /** The function used to execute the command */
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>

    /**
     * Default constructor
     *
     * @param data - The SlashCommandBuilder used to deploy the command
     * @param execute - The function used to execute the command
     */
    constructor(
        data: SlashCommandBuilder,
        execute: (interaction: ChatInputCommandInteraction) => Promise<void>
    ) {
        this.data = data
        this.execute = execute
    }
}

/**
 * Class to manage all commands of the application. It reads command files
 * from subfolders of the foldersPath folder and stores the commands.
 */
export class CommandManager implements Iterable<Command> {
    /** stores all promises to the commands */
    #promises = new Array<Promise<Command>>()
    /** Collection of commands */
    #commands = new Collection<string, Command>()

    /**
     * Default constructor. Do not use! Commands collection will not be
     * populated by the time the constructor returns.
     *
     * @param foldersPath - Path to the root folder of the commands directory
     */
    constructor(foldersPath: URL) {
        const commandFolders = fs.readdirSync(foldersPath)

        for (const folder of commandFolders) {
            const commandsPath = new URL(folder + "/", foldersPath)
            const commandFiles = fs
                .readdirSync(commandsPath)
                .filter((file) => file.endsWith(".js"))

            for (const file of commandFiles) {
                const filePath = new URL(file, commandsPath)
                const promise = import(filePath.toString())
                promise.then((obj) => {
                    const command: Command = obj.command
                    this.#commands.set(command.data.name, command)
                })
                this.#promises.push(promise)
            }
        }
    }

    /**
     * Constructs CommandManager and waits until all command files are read.
     * @param foldersPath - Path to the root folder of the commands directory
     * @returns CommandManager with populated commands collection
     */
    public static loadFolder = async (foldersPath: URL) => {
        const manager = new CommandManager(foldersPath)
        await Promise.all(manager.#promises)

        return manager
    }

    /**
     * Returns the command with name name.
     *
     * @param name - Command name
     * @returns Command or undefined if no command is found.
     */
    get(name: string): Command | undefined {
        return this.#commands.get(name)
    }

    /**
     * Iterator over all commands used by for..of.
     * @returns
     */
    [Symbol.iterator](): Iterator<Command> {
        return this.#commands.values()
    }
}
