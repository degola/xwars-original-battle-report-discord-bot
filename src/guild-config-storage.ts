/**
 * sqlite storage for guild configuration
 * @module
 */

import "dotenv/config"

const GUILD_CONFIG_DATABASE =
    process.env.GUILD_CONFIG_DATABASE || "config/guild_config.sqlite3"

import sqlite3 from "sqlite3"
import { open, Database } from "sqlite"
import { Snowflake } from "discord.js"

interface KeyValueRow {
    key: string
    value: string
}

interface ValueRow {
    value: string
}

/** Class representing the guild configuration storage. */
export class GuildConfigStorage {
    /** The database handle */
    #db: Database<sqlite3.Database, sqlite3.Statement> | undefined

    /**
     * Opens the database or creates it if it doesn't exist. Also creates the
     * database scheme if it doesn't exist.
     */
    constructor() {
        // Open database
        open({
            filename: GUILD_CONFIG_DATABASE,
            driver: sqlite3.cached.Database,
        }).then((db) => {
            db.getDatabaseInstance().serialize()

            // Create table if it does not exist
            db.exec(
                "CREATE TABLE IF NOT EXISTS guild_config (guild_id TEXT, key TEXT, value TEXT)"
            )
            // Create indices if they do not exist
            db.exec(
                "CREATE INDEX IF NOT EXISTS guild_config__guild_id ON guild_config(guild_id)"
            )
            db.exec(
                "CREATE UNIQUE INDEX IF NOT EXISTS guild_config__guild_id_key ON guild_config(guild_id, key)"
            )

            this.#db = db
        })
    }

    /**
     * Get all configuration values for a guild.
     *
     * @param {Snowflake} guildId - The id of the guild.
     * @returns {Map<string, string> | null} Returns a map of all guild configuration key-value pairs or null if no key exists for the guild.
     */
    async getConfig(guildId: Snowflake) {
        if (!this.#db) {
            throw new Error("Database not open yet")
        }
        const rows = await this.#db.all<KeyValueRow[]>(
            "SELECT key, value FROM guild_config WHERE guild_id = ?",
            guildId
        )

        if (rows.length == 0) {
            return null
        }

        const config = new Map<string, string>()
        for (const row of rows) {
            config.set(row.key, row.value)
        }

        return config
    }

    /**
     * Get a configuration value.
     *
     * @param {Snowflake} guildId - The id of the guild.
     * @param {string} key - The configuration key.
     * @returns {string | null} The configuration value or null if the key ist not set.
     */
    async getValue(guildId: Snowflake, key: string) {
        if (!this.#db) {
            throw new Error("Database not open yet")
        }
        const row = await this.#db.get<ValueRow>(
            "SELECT value FROM guild_config WHERE guild_id = ? AND key = ?",
            [guildId, key]
        )

        if (!row) {
            return null
        }

        return row.value
    }

    /**
     * Set a configuration value.
     *
     * @param {Snowflake} guildId - The id of the guild.
     * @param {string} key - The configuration key.
     * @param {string} value - The configuration value.
     */
    setValue(guildId: Snowflake, key: string, value: string) {
        if (!this.#db) {
            throw new Error("Database not open yet")
        }
        this.#db.run(
            "INSERT OR REPLACE INTO guild_config (guild_id, key, value) VALUES (?, ?, ?)",
            [guildId, key, value]
        )
    }
}
