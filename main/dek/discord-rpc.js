
import DEAP from './deap';
import DiscordRPC from 'discord-rpc';

import localization from '../../renderer/locales/en-dektionary.json';
import game_map from './game-map';
import fs from 'fs';

// const path = require('path');
// const { app } = require('electron');
// import {config} from 'dotenv';
// config({ path: path.join(app.getAppPath(), '.env') });


// Including your Discord App ID in a public repo is safe as long as you 
// do not include your client secret, bot token, or any sensitive keys.

const clientId = "1330098254653816842";

// Only needed if using spectate, join, or ask to join
// DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({ transport: 'ipc' });


const nexusBaseURL = 'https://www.nexusmods.com';
const gameToAppModID = {
    "palworld": 2017,
    "ff7rebirth": 69,
    "stellar-blade": 206,
    "mgs-delta": 43,
}

const UPDATE_FREQ = 30e3;//15e3;
const REATTEMPT_FREQ = 15 * 60e3; // every 15 minutes:

let startTimestamp;

export default {
    started: false,
    paused: false,
    handle: null,
    isset: false,
    available() {
        let ipcPath = `\\\\?\\pipe\\discord-ipc-0`;
        if (!process.platform === 'win32') {
            ipcPath = `${process.env.XDG_RUNTIME_DIR || '/tmp'}/discord-ipc-0`;
        } 
        return fs.existsSync(ipcPath);
    },
    start() {
        // const available = this.available();
        // console.log('Starting Discord RPC:', available);
        // if (!available) return;
        rpc.login({ clientId }).then(() => {
            console.log('Discord RPC connected');
            startTimestamp = new Date();
            this.started = true;
            this.paused = false;
            this.handle = setInterval(() => {
                this.update();
            }, UPDATE_FREQ);
            this.update();
        }).catch(error => {
            console.error('Discord RPC error:', error);
            setTimeout(() => this.start(), REATTEMPT_FREQ); // re-attempt connection
        });
    },
    stop() {
        if (!this.started) return;
        if (!this.handle) return;
        clearInterval(this.handle);
        this.started = false;
        this.paused = false;
        rpc.destroy();
    },
    pause() {
        if (!this.started) return;
        if (this.paused) return;
        this.paused = true;
        rpc.clearActivity();
        console.log('Paused Discord RPC');
    },
    unpause() {
        if (!this.paused) return;
        if (!this.started) this.start();
        startTimestamp = new Date();
        this.paused = false;
        // this.update();
        console.log('Unpaused Discord RPC');
    },
    async update() {
        if (!rpc) return;
        if (!this.started) return;
        if (this.paused) return;
        
        const allowRPC = await DEAP.datastore.get('allow-rpc');
        if (!allowRPC && this.isset) return rpc.clearActivity();
        if (!allowRPC) return;
        
        // console.log('Updating Discord RPC');

        // const playtime = new Date() - startTimestamp;
        // const minutes = Math.floor(playtime / 60000);
        const maxLen = 23;
        const gameData = await DEAP.datastore.get('games.active');
        const gameName = gameData ? gameData.split('.')[0] : 'unknown';
        const localGameName = localization.games?.[gameName]?.name || gameName;
        const nameLen = localGameName.length;
        const details = nameLen > maxLen ? `Managing Game Mods For:` : `Managing Mods`;
        const state = nameLen > maxLen ? localGameName : `For: ${localGameName}`;
        const largeImageText = `Mod Hub: The ultimate mod manager for Unreal Engine games!`; 
        const largeImageKey = 'app-icon';

        let buttons = undefined;
        const nexusAppModID = gameToAppModID[gameName];
        const nexusGameSlug = game_map[gameName]?.providers?.nexus;
        if (nexusAppModID) {
            const url = `${nexusBaseURL}/${nexusGameSlug}/mods/${nexusAppModID}`;
            buttons = [{ label: 'Get The Mod Hub App', url }];
        }

        // NOTE: need to have any used image assets uploaded to
        // https://discord.com/developers/applications/<application_id>/rich-presence/assets
        rpc.setActivity({
            details, state, 
            startTimestamp,
            largeImageKey,
            largeImageText,
            instance: true,
            buttons,
            // state?: string | undefined;
            // details?: string | undefined;
            // startTimestamp?: number | Date | undefined;
            // endTimestamp?: number | Date | undefined;
            // largeImageKey?: string | undefined;
            // largeImageText?: string | undefined;
            // smallImageKey?: string | undefined;
            // smallImageText?: string | undefined;
            // instance?: boolean | undefined;
            // partyId?: string | undefined;
            // partySize?: number | undefined;
            // partyMax?: number | undefined;
            // matchSecret?: string | undefined;
            // spectateSecret?: string | undefined;
            // joinSecret?: string | undefined;
            // buttons?: Array<{ label: string; url: string }> | undefined;
        });
        this.isset = true;
    },
}

