/*
########################################
# PalHUB::Client by dekitarpg@gmail.com
########################################
*/

// class to interact with the NexusMods API
// see https://github.com/Nexus-Mods/node-nexus-api for more details
import Nexus from "@nexusmods/nexus-api";
import DEAP from "./deap.js";

// import stringify from "json-stringify-pretty-compact";
import { createReadStream, createWriteStream, watchFile, unwatchFile, readFileSync, copyFile } from "fs";
import { exec, execFile, spawn } from "child_process";
import fs from "node:fs/promises";
import path from "node:path";
import {https} from "follow-redirects";
import ArchiveHandler from "./archive-handler.js";
import EventEmitter from "events";

import GAME_MAP from "./game-map.js";

export const Emitter = new EventEmitter();

Emitter.EVENTS_TO_HANDLE = [
    'watched-file-change',
    'download-mod-file', 
    'install-mod-file', 
    'extract-mod-file', 
    'ue4ss-process', 
];

function stringifyJSON(data) {
    return JSON.stringify(data, null, 4);
    return stringify(data, { maxLength: 124, indent: 4 });
}

async function wait(milliseconds = 1000) {
    return new Promise((r) => setTimeout(r, milliseconds));
}

/**
 * PalHUB API Interface <3
 * Handles interactions between the client's machine and the main PalHUB server.
 *
 * @class API
 * @method get
 * @method post
 * @method getModList
 */
export class API {
    static async get(url) {
        const response = await fetch(url);
        return response.json();
    }

    static async post(url, data) {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        return response.json();
    }

    static async getModList() {
        return await this.get("http://localhost:3000/mods");
    }
}


// class DekNexus extends Nexus {

//     //! doesnt work - rip lol
//     //todo: ask for help on this one
//     async getRequiredMods(modId) {
//         await this.mQuota.wait();
//         let urlPath = '/games/{gameId}/mods/{modId}/requirements';
//         return this.request(this.mBaseURL + urlPath, this.args({ 
//             path: this.filter({ modId, gameId }) 
//         }));
//     }

// }



/**
* PalHUB Client Interface <3
* Handles client machine interactions. eg, managing mods, starting servers, etc.
*/
export class Client {

    static setAppDetails(appName, appVersion) {
        this.appName = appName;
        this.appVersion = appVersion;
        console.log("setAppDetails:", appName, appVersion);
    }

    static async ensureNexusLink(api_key) {
        if (this._nexus) return this._nexus;
        this._nexus = new Nexus({
            appVersion: this.appVersion ?? "0.0.1",
            appName: this.appName ?? "PalHUB"
        });
        await this._nexus.setKey(api_key);
        return this._nexus;
    }

    // use node js to validate the game installation seems to be a valid game path
    // also determine if it is installeld for steam, xbox pass, or windows store.
    static async validateGamePath(game_path) {
        return new Promise(async (resolve, reject) => {
            if (!!!game_path) return resolve({ type: "{invalid-path}" });
            try {
                console.log("validating game path", game_path);
                // const exists = await fs.access(game_path);
                const files = await fs.readdir(game_path, { withFileTypes: true }); //, encoding: 'utf-8', recursive: true});
                const fileExists = (filename) => files.some((file) => file.isFile() && file.name === filename);
                // console.log({ files });

                // ue folder/project names
                // Palworld - Pal
                // HL - Phoenix
                // FF7R - End

                for (const [game_key, map_data] of Object.entries(GAME_MAP)) {
                    if (game_key === 'generic') continue; // skip generic
                    
                    for (const platform of ["epic", "steam", "xbox"]) {
                        for (const launch_type of ["demo", "game", "server"]) {
                            // console.log("checking:", platform, launch_type, game_key);


                            // platforms.game.steam.id = steam app id
                            const data = map_data.platforms?.[launch_type]?.[platform];
                            if (!data) continue; // skip if no data

                            // console.log(data);

                            // {id: "7654321", root: "UEProjectRoot", app: "ServerExeName"}, 
                            const {root, app, match=null} = data;
                            if (!root || !app) continue; // skip if no id, root, or app data

                            // TODO: TEST: steam://rungameid/STEAMGAMEID
                            const check_for_egstore = platform === "epic";
                            const has_egstore = check_for_egstore && await fs.access(path.join(game_path, ".egstore")).then(()=>true).catch(()=>false);

                            const app_name = `${app}.exe`;

                            const checkmatch = match ? match.test(game_path) : true;

                            // console.log("checking for:", app_name);
                            if (fileExists(app_name) && checkmatch && (!check_for_egstore || has_egstore)) {
                                console.log("found:", app_name);
                                const exe_path = path.join(game_path, app_name);
                                const content_path = path.join(game_path, `${root}/Content`);
                                const pak_path = path.join(game_path, `${root}/Content/Paks`);
                                const ue4ss_dir = platform === "xbox" ? "WinGDK" : "Win64";
                                const ue4ss_root = path.join(game_path, `${root}/Binaries/${ue4ss_dir}`);
                                const ue4ss_path = path.join(ue4ss_root, "dwmapi.dll");
                                const has_ue4ss = await fs.access(ue4ss_path).then(()=>true).catch(()=>false);
                                let ue4ss_settings = path.join(ue4ss_root, "UE4SS-settings.ini");
                                const ue4ss_settings_exp = path.join(ue4ss_root, 'ue4ss', "UE4SS-settings.ini");
                                const has_experimental_settings = await fs.access(ue4ss_settings_exp).then(()=>true).catch(()=>false);
                                if (has_ue4ss && has_experimental_settings) ue4ss_settings = ue4ss_settings_exp;
                                // const nexus_slug = map_data.providers.nexus

                                console.log("found ue4ss settings:", ue4ss_settings);

                                // returns `game` object with all the data <3
                                return resolve({
                                    id: game_key,
                                    type: platform,
                                    path: game_path,
                                    has_exe: true,
                                    exe_path,
                                    pak_path,
                                    has_ue4ss,
                                    ue4ss_path,
                                    ue4ss_root,
                                    ue4ss_settings,
                                    content_path,
                                    launch_type,
                                    map_data,
                                    unreal_root: root,
                                    // nexus_slug,
                                });
                            }
                        }
                    }
                }

                // const content_path = path.join(game_path, "Pal/Content");
                // const pak_path = path.join(game_path, "Pal/Content/Paks");

                // if (fileExists("Palworld.exe")) { // steam/windows
                //     const exe_path = path.join(game_path, "Palworld.exe");
                //     const ue4ss_root = path.join(game_path, "Pal/Binaries/Win64");
                //     const ue4ss_path = path.join(ue4ss_root, "dwmapi.dll");
                //     const has_ue4ss = await fs.access(ue4ss_path).then(()=>true).catch(()=>false);
                //     return resolve({
                //         type: "steam",
                //         has_exe: true,
                //         exe_path,
                //         pak_path,
                //         has_ue4ss,
                //         ue4ss_path,
                //         ue4ss_root,
                //         content_path,
                //     });
                // }
                // else if (fileExists("gamelaunchhelper.exe")) { // xbox gamepass
                //     const exe_path = path.join(game_path, "gamelaunchhelper.exe");
                //     const ue4ss_root = path.join(game_path, "Pal/Binaries/WinGDK");
                //     const ue4ss_path = path.join(ue4ss_root, "dwmapi.dll");
                //     const has_ue4ss = await fs.access(ue4ss_path).then(()=>true).catch(()=>false);
                //     // console.log({ exe_path, has_exe, ue4ss_path, has_ue4ss });
                //     return resolve({
                //         type: "xbox",
                //         has_exe: true,
                //         exe_path,
                //         pak_path,
                //         has_ue4ss,
                //         ue4ss_path,
                //         ue4ss_root,
                //         content_path,
                //     });
                // }
                // cant seem to validate game.. unknown path
                throw new Error("Unknown game path");
            } catch (error) {
                console.error("validateGamePath error", error);
                // return reject({ type: "{UNKNOWN}" });
            }
            resolve({ type: "{UNKNOWN}" });
        });
    }


    static async downloadFile(cache_dir, download_url, callbacks={}) {
        const filename = download_url.split("/").pop();
        const outputPath = path.join(cache_dir, filename);

        return new Promise((resolve, reject) => {
            https.get(download_url, (response) => {
                if (response.statusCode !== 200) {
                    return reject(new Error(`Failed to get '${download_url}' (${response.statusCode})`));
                }

                const totalSize = parseInt(response.headers["content-length"], 10);

                let downloadedSize = 0;

                response.on("data", (chunk) => {
                    downloadedSize += chunk.length;
                    const percentage = ((downloadedSize / totalSize) * 100).toFixed(2);
                    process.stdout.write(`Downloading: ${percentage}%\r`);

                    if (callbacks.onProgress) callbacks.onProgress({ filename, outputPath, percentage });
                    else Emitter.emit("download-file", {
                        filename,
                        outputPath,
                        percentage,
                    });
                });
                // pipe the response to the new file as its received. This is a streaming download
                // so the file is saved to disk as it downloads. helpful for large files. 
                const newfile = createWriteStream(outputPath);
                newfile.on("finish", () => {
                    newfile.close(() => {
                        console.log("\nDownload completed: ", filename);
                        if (callbacks.onFinish) callbacks.onFinish({ filename, outputPath });
                        resolve(true);
                    });
                });
                newfile.on("error", (error) => {
                    if (callbacks.onError) callbacks.onError({ filename, outputPath, error });
                    fs.unlink(outputPath, () => {}); // Delete the file async if an error occurs
                    reject({ error });
                });
                response.pipe(newfile);
            })
            .on("error", (error) => {
                if (callbacks.onError) callbacks.onError({ filename, outputPath, error });
                fs.unlink(outputPath, () => {}); // Delete the file async if an error occurs
                reject({ error });
            });
        });        
    }





    // download and install mod from nexus
    // mod will be a zip file and may be very large
    // we use steaming to save the file to disk as it downloads
    static async downloadMod(cache_path, download_url, mod, file) {
        const outputPath = path.join(cache_path, file.file_name);

        if (!mod) return Promise.reject("No mod data provided");
        if (!file) return Promise.reject("No file data provided");
        if (!download_url) return Promise.reject("No download URL provided");
        if (await this.checkModFileIsDownloaded(cache_path, file)) return Promise.reject("Mod file already downloaded");

        return new Promise((resolve, reject) => {
            const newfile = createWriteStream(outputPath);

            https
                .get(download_url, (response) => {
                    if (response.statusCode !== 200) {
                        reject(new Error(`Failed to get '${download_url}' (${response.statusCode})`));
                        return;
                    }

                    const totalSize = parseInt(response.headers["content-length"], 10);
                    let downloadedSize = 0;

                    response.on("data", (chunk) => {
                        downloadedSize += chunk.length;
                        const percentage = ((downloadedSize / totalSize) * 100).toFixed(2);
                        process.stdout.write(`Downloading: ${percentage}%\r`);
                        Emitter.emit("download-mod-file", {
                            mod_id: mod.mod_id,
                            file_id: file.file_id,
                            percentage,
                        });
                    });

                    response.pipe(newfile);

                    newfile.on("finish", () => {
                        newfile.close(() => {
                            this.addModDataToCacheJSON(cache_path, mod, file).then(()=>{
                                console.log("\nDownload completed.");
                                resolve(true);
                            });
                        });
                    });

                    newfile.on("error", (error) => {
                        fs.unlink(outputPath, () => {}); // Delete the file async if an error occurs
                        reject({ error });
                    });
                })
                .on("error", (error) => {
                    fs.unlink(outputPath, () => {}); // Delete the file async if an error occurs
                    reject({ error });
                });
        });
    }





    static checkPakForLogicMod(pakFilePath, assetName='ModActor.uasset') {
        try {
            const dirPath = path.dirname(pakFilePath);
            const baseName = path.basename(pakFilePath, '.pak'); // Get the base name without extension

            // Check if corresponding .ucas and .utoc files exist
            const ucasFilePath = path.join(dirPath, `${baseName}.ucas`);
            const utocFilePath = path.join(dirPath, `${baseName}.utoc`);

            // If both .ucas and .utoc files exist, recurse using the .utoc file
            if (fs.existsSync(ucasFilePath) && fs.existsSync(utocFilePath)) {
                console.log(`Found .ucas and .utoc files for ${baseName}, checking ${utocFilePath}...`);
                return checkPakForLogicMod(utocFilePath, assetName); // Recurse with .utoc file
            }

            // If the pak file or .utoc file doesn't exist, proceed with reading the .pak file
            const fileBuffer = fs.readFileSync(pakFilePath);
            const readableData = fileBuffer.toString('utf-8');
            
            // Modify regex to search for the specific asset name (case-insensitive)
            const matches = [...readableData.matchAll(new RegExp(`${assetName}`, 'gi'))];

            // Return true if asset is found, otherwise false
            return {
                found: matches.length > 0,
                paktype: path.extname(pakFilePath).slice(1), // Get the package name without the dot
                assetName,
            };

        } catch (error) {
            console.error('Error reading pak file:', error.message);
            return {found: false}; // Return false in case of any error
        }
    }



    static async checkPakForLogicModInZip(zipEntries, assetName = 'ModActor.uasset') {
        try {
            // Look for pak and utoc files in zip entries
            for (const entry of zipEntries) {
                // Check if the entry is a .pak or .utoc file
                if (!entry.isDirectory && (entry.entryName.endsWith('.pak') || entry.entryName.endsWith('.utoc'))) {
                    const fileBuffer = await entry.getData();
                    const readableData = fileBuffer.toString('utf-8');

                    // Check for asset name in the file
                    const matches = [...readableData.matchAll(new RegExp(assetName, 'gi'))];

                    if (matches.length > 0) {
                        return {
                            found: true,
                            paktype: path.extname(entry.entryName).slice(1), // Get the package name without the dot
                            fileName: entry.entryName,
                            assetName,
                        };
                    }
                }
            }

            // If no asset was found
            return {
                found: false,
                assetName,
            };

        } catch (error) {
            console.error('Error processing zip file:', error.message);
            return { found: false }; // Return false in case of any error
        }
    }





    static async determineInstallPath(game_path, entries, forcedRoot=null) {
        let install_path = game_path;

        const game_data = await this.validateGamePath(game_path);
        // console.log("determineInstallPath:");
        // console.log({ game_path, game_data });

        // determine the actual first entry, ignoring any 'root' directories that may be present
        const allowedRoots = [game_data.unreal_root, "Binaries", "Content", "Win64", "WinGDK", "Mods", "Movies", "Paks", "LogicMods", "~mods"];

        let ignoredRoots = '';

        // entries.sort((a, b) => a.entryName.length - b.entryName.length);
        const folders = new Set(); // To store unique folder paths
        for (const entry of entries) {
            console.log({ entry });
            const entryPath = entry.entryName;
        
            // If the entry is not a directory, derive its parent directories
            if (!entry.isDirectory) {
                const parts = entryPath.split("/");
                for (let i = 1; i < parts.length; i++) {
                    folders.add(parts.slice(0, i).join("/") + "/");
                }
            } else {
                // If the entry is a directory, add it directly
                folders.add(entryPath);
            }
        }
        // Convert the set to an array and sort it (optional, for readability)
        const folderList = Array.from(folders);//.sort();
        console.log("Detected folders:", folderList);


        const getFirstFileEntry = () => entries.find((entry) => {
            const replaced = entry.entryName.replace(ignoredRoots, '');
            const root = replaced.split(/[\\/]/).shift();
            console.log('checking root:', root);
            // console.log({ root, replaced });
            if (allowedRoots.includes(root)) return true;
            if (entry.isDirectory) ignoredRoots = `${root}/`;
            return false;
        }) ?? entries[0];

        let firstFileEntry = getFirstFileEntry();

        if (ignoredRoots === 'Scripts/') { // seems to be a lua mod with a dumb zip structure
            // set the output path for each entry, assuming it is a poorly packaged lua mod
            for (const entry of entries) {
                entry.outputPath = `Mods/${entry.entryName}`
            }
            // add fake first entry: 
            entries.unshift({ entryName: 'Mods/', isDirectory: true, outputPath: 'Mods/' });
            firstFileEntry = getFirstFileEntry(); // replace the first entry with fake 'Mods/' entry
        } else {
            // set the output path for each entry based on the ignored roots
            for (const entry of entries) {
                entry.outputPath = entry.entryName.replace(ignoredRoots, '');
            }
        }

        // if the entry is a file and not in the allowed roots, ignore it
        const part_checker = part => allowedRoots.includes(part);
        const VALID_FILETYPES = ['pak', 'ucas', 'utoc', 'txt', 'json', 'lua', 'md', 'bk2', 'bmp'];
        const ignored_files = entries.filter(({isDirectory=false, entryName='', size=0}) => { 
            const seemsValid = VALID_FILETYPES.some(ext => entryName.endsWith(`.${ext}`));
            if (!isDirectory && seemsValid) return false;
            if (!isDirectory && size === 0) return true;
            return !isDirectory && !entryName.split('/').some(part_checker);
        }).map(({entryName}) => entryName);

        console.log({ firstFileEntry, ignoredRoots, ignored_files, game_data });

        if (forcedRoot !== null) {
            switch (forcedRoot) {
                case `${game_data.unreal_root}/`:
                    install_path = game_path;
                    break;
                case "Binaries/":
                    install_path = path.join(game_path, game_data.unreal_root, 'Binaries');
                    break;
                case "Content/":
                    install_path = path.join(game_path, game_data.unreal_root, 'Content');
                    break;
                case "Mods/":
                    if (game_path.includes('XboxGames')) install_path = path.join(game_path, game_data.unreal_root, "Binaries/WinGDK");
                    else install_path = path.join(game_path, game_data.unreal_root, "Binaries/Win64");
                    break;
                case "Movies/":
                    install_path = path.join(game_path, game_data.unreal_root, "Content/Movies");
                    break;
                case "Splash/":
                    install_path = path.join(game_path, game_data.unreal_root, "Content/Splash");
                    break;
                case "Paks/":
                    install_path = path.join(game_path, game_data.unreal_root, "Content/Paks");
                    break;
                case "LogicMods/":
                    install_path = path.join(game_path, game_data.unreal_root, "Content/Paks/LogicMods");
                    break;
                default: // ~mods/ or unknown mod type ~ assume regular .pak replacement
                    install_path = path.join(game_path, game_data.unreal_root, "Content/Paks/~mods");
                    break;
            }
        } else if (firstFileEntry.isDirectory) {
            switch (forcedRoot ?? firstFileEntry.outputPath) {
                case `${game_data.unreal_root}/`:
                    install_path = game_path;
                    break;
                case "Binaries/":
                case "Content/":
                    install_path = path.join(game_path, game_data.unreal_root);
                    break;
                case "Win64/":
                case "WinGDK/":
                    install_path = path.join(game_path, game_data.unreal_root, "Binaries"); 
                    break;
                case "Mods/":
                    if (game_path.includes('XboxGames')) install_path = path.join(game_path, game_data.unreal_root, "Binaries/WinGDK");
                    else install_path = path.join(game_path, game_data.unreal_root, "Binaries/Win64");
                    break;
                case "Movies/":
                    install_path = path.join(game_path, game_data.unreal_root, "Content");
                    break;
                case "Splash/":
                    install_path = path.join(game_path, game_data.unreal_root, "Content");
                    break;
                case "Paks/":
                    install_path = path.join(game_path, game_data.unreal_root, "Content");
                    break;
                case "LogicMods/":
                    install_path = path.join(game_path, game_data.unreal_root, "Content/Paks");
                    break;
                default: // ~mods/ or unknown mod type ~ assume regular .pak replacement
                    const zipAssetFound = await this.checkPakForLogicModInZip(entries);
                    // const pakAssetFound = checkPakForLogicMod(pakFilePath);
                    console.log({zipAssetFound});
                    if (zipAssetFound?.found) {
                        // unknown mod type ~ assume regular .pak replacement
                        install_path = path.join(game_path, game_data.unreal_root, "Content/Paks/LogicMods");
                    } else if (firstFileEntry.entryName.endsWith('.bk2')) {
                        console.log('install type seems like movie file, assuming Movies/');
                        install_path = path.join(game_path, game_data.unreal_root, "Content/Movies");
                    } else if (/splash/i.test(firstFileEntry.entryName) && firstFileEntry.entryName.endsWith('.bmp')) {
                        console.log('install type seems like image file, assuming Splash/');
                        install_path = path.join(game_path, game_data.unreal_root, "Content/Splash");
                    } else {
                        console.log('unknown install type assuming ~mods');
                        // unknown mod type ~ assume regular .pak replacement
                        install_path = path.join(game_path, game_data.unreal_root, "Content/Paks/~mods");
                    }
                    break;
            }
        } else {
            const zipAssetFound = await this.checkPakForLogicModInZip(entries);
            // const pakAssetFound = checkPakForLogicMod(pakFilePath);
            console.log({zipAssetFound});
            if (zipAssetFound?.found) {
                // unknown mod type ~ assume regular .pak replacement
                install_path = path.join(game_path, game_data.unreal_root, "Content/Paks/LogicMods");
            } else if (firstFileEntry.entryName.endsWith('.bk2')) {
                console.log('install type seems like movie file, assuming Movies/');
                install_path = path.join(game_path, game_data.unreal_root, "Content/Movies");
            } else if (/splash/i.test(firstFileEntry.entryName) && firstFileEntry.entryName.endsWith('.bmp')) {
                console.log('install type seems like image file, assuming Splash/');
                install_path = path.join(game_path, game_data.unreal_root, "Content/Splash");
            } else {
                console.log('unknown install type assuming ~mods');
                // unknown mod type ~ assume regular .pak replacement
                install_path = path.join(game_path, game_data.unreal_root, "Content/Paks/~mods");
            }
        }
        return [install_path, ignored_files, entries];
    }


    static installMod(cache_path, game_path, mod, file, isLocal=false, forcedRoot=null, extraJsonProps={}) {
        return new Promise(async (resolve, reject) => {
            try {
                // check if the mod is already downloaded
                const downloaded = isLocal || await this.checkModFileIsDownloaded(cache_path, file);
                if (!downloaded) return reject("Mod file not downloaded");
                // check if the mod is already installed
                const installed = await this.checkModIsInstalled(game_path, mod, file);
                if (installed) return reject("Mod already installed");

                // unzip the mods zip file, and copy it to the game directory
                const archive = new ArchiveHandler(path.join(cache_path, file.file_name));
                const entries = await archive.getEntries();

                // determine the root path to install this mods files to
                const [install_path, ignored_files] = await this.determineInstallPath(game_path, entries, forcedRoot);

                for (const entry of entries) {
                    // do backup if bk2 file
                    if (entry.entryName.endsWith('.bk2') || entry.entryName.endsWith('.bmp')) {     
                        console.log("found movie file:", entry.entryName);
                        await this.backupFileForDelete(path.join(install_path, entry.entryName));
                    }
                }


                Emitter.emit("install-mod-file", {
                    install_path,
                    name: mod.name,
                    version: file.version,
                    mod_id: mod.mod_id,
                    file_id: file.file_id,
                    entries: entries.map((entry) => entry.entryName),
                });

                // forward the extracting event to the renderer
                archive.on("extracting", (data) => {
                    console.log("extracting:", data);
                    Emitter.emit("extract-mod-file", data);
                });

                console.log("extracted to:", install_path);
                await archive.extractAllTo(install_path, ignored_files);

                // add mod data to the config file
                const propName = isLocal ? 'local_mods' : 'mods';
                await this.addModDataToJSON(game_path, mod, file, entries, ignored_files, propName, install_path, extraJsonProps);


                return resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    static uninstallMod(game_path, mod, config_override=null, local=false) {
        console.log("uninstalling mod:", mod.name);
        return new Promise(async (resolve, reject) => {
            try {
                // check if the mod is already installed
                const installed = config_override || await this.checkModIsInstalled(game_path, mod);
                if (!local && !installed) return reject("Mod not installed");
                // remove the mod from the config file
                const {root, entries} = await this.removeModDataFromJSON(game_path, mod, config_override, local);
                console.log("uninstalling mod entries:", entries);

                const game_data = await this.validateGamePath(game_path);

                // determine the root path to uninstall this mods files from
                const firstEntry = entries[0];
                let base_path = game_path;
                switch (firstEntry) {
                    case `${game_data.unreal_root}/`:
                        base_path = game_path;
                        break;
                    case "Binaries/":
                    case "Content/":
                        base_path = path.join(game_path, game_data.unreal_root);
                        break;
                    case "Win64/":
                    case "WinGDK/":
                        base_path = path.join(game_path, game_data.unreal_root, "Binaries");
                        break;
                    case "Mods/":
                        if (game_path.includes('XboxGames')) base_path = path.join(game_path, game_data.unreal_root, "Binaries/WinGDK");
                        else base_path = path.join(game_path, game_data.unreal_root, "Binaries/Win64");
                        break;
                    case "Movies/":
                        base_path = path.join(game_path, game_data.unreal_root, "Content");
                        break;
                    case "Splash/":
                        base_path = path.join(game_path, game_data.unreal_root, "Content");
                        break;
                    case "Paks/":
                        base_path = path.join(game_path, game_data.unreal_root, "Content");
                        break;
                    case "LogicMods/":
                        base_path = path.join(game_path, game_data.unreal_root, "Content/Paks");
                        break;
                    default: // ~mods/ or unknown mod type ~ assume regular .pak replacement
                        base_path = path.join(game_path, game_data.unreal_root, "Content/Paks/~mods");
                        break;
                }
                // remove the mod files from the game directory
                const used_entries = [];
                for (const entry of entries) {
                    const fileordir = path.join(root ?? base_path, entry);
                    console.log("iterating:", fileordir);
                    // unlink if file, ignore if directory
                    if ((await fs.stat(fileordir)).isDirectory()) continue;

                    await fs.unlink(fileordir);
                    used_entries.push(entry);

                    // do backup if bk2 file
                    if (fileordir.endsWith('.bk2') || fileordir.endsWith('.bmp')) {     
                        console.log("restoring movie file:", fileordir);
                        await this.restoreBackupFile(fileordir);
                    }

                }

                // sort entries from longest to shortest to ensure we delete the deepest directories first
                entries.sort((a, b) => b.length - a.length);
                
                for (const entry of entries) {
                    if (used_entries.includes(entry)) continue;
                    const fileordir = path.join(base_path, entry);
                    if (!(await fs.stat(fileordir)).isDirectory()) continue;
                    const files = await fs.readdir(fileordir);
                    if (files.length) continue;

                    console.log("deleting empty directory:", fileordir);
                    await fs.rmdir(fileordir, { recursive: true });
                }

                resolve(true);
            } catch (error) {
                reject({ error });
            }
        });
    }

    static validateModFiles(game_path, mod, file) {
        return new Promise(async (resolve, reject) => {
            try {

                // console.log({ game_path, mod, file });
                
                // check if the mod is already installed
                const installed = await this.checkModIsInstalled(game_path, mod, file);
                if (!installed) return reject("Mod not installed");
                
                console.log('validating mod files:', game_path, mod.mod_id, file.file_name);

                // iterate over the mod files and check if they exist
                const config = await this.readJSON(game_path);
                console.log('read json config:', config);
                const mod_data = config.mods[mod.mod_id];
                console.log('mod data:', mod_data);
                const entries = mod_data.entries.map((entry) => ({ entryName: entry }));
                const [base_path, ignored_files] = await this.determineInstallPath(game_path, entries);

                console.log("validating base path:", base_path);

                const results = {};
                for (const entry of entries) {
                    const fileordir = path.join(base_path, entry?.outputPath ?? entry.entryName);
                    results[entry] = await fs.access(fileordir).then(() => true).catch(() => false);
                }

                resolve(true);

            } catch (error) {
                reject(error);
            }
        });
    }


    // todo: update this so that only one read/write for json is done
    static async uninstallAllMods(game_path) {
        try {
            console.log("uninstalling all mods from:", game_path);
            const config = await this.readJSON(game_path);
            const result = {}
            const mod_keys = Object.keys(config.mods);
            for (const mod_id of mod_keys) {
                console.log("uninstalling mod:", mod_id);
                // const mod = config.mods[mod_id];
                result[mod_id] = await this.uninstallMod(game_path, {mod_id}, config);
                console.log("uninstalled mod:", mod_id, result[mod_id]);
            }
            await this.writeJSON(game_path, config);
            return result;
        } catch (error) {
            console.error("uninstallAllMods error", error);
        }
    }

    static async checkModFileIsDownloaded(cache_path, file) {
        try {
            console.log("checking if mod file is downloaded", path.join(cache_path, file.file_name));
            await fs.access(path.join(cache_path, file.file_name));
            console.log(`mod file is downloaded: ${file.file_name}`);
            return true;
        } catch (error) {
            console.log(`mod file is NOT downloaded: ${file.file_name}`, error);
            return false;
        }
    }

    static async checkModIsInstalled(game_path, mod, file = null) {
        console.log("checking if mod is installed", game_path, mod?.name, file?.file_name);
        try {
            // check if the mod is already installed
            const config = await this.readJSON(game_path);
            if (config.local_mods && config.local_mods[mod.mod_id]) return true;

            if (!config.mods || !config.mods[mod.mod_id]) return false;
            const mod_data = config.mods[mod.mod_id];
            if (!mod_data) return false;

            // return true if file unspecified or matches installed file
            return file ? mod_data.file_name === file.file_name : true;
        } catch (error) {
            console.error("checkModIsInstalled error", error);
        }
        return false;
    }

    static async checkIsValidFolderPath(path) {
        try {
            await fs.access(path);
            return true;
        } catch (error) {
            return false;
        }
    }



    static get json_filename() {
        return "palhub.config.json";
    }
    static joinPath(...args) {
        return path.join(...args);
    }
    static async readFile(...args) {
        return await fs.readFile(...args);
    }
    static async writeFile(...args) {
        return await fs.writeFile(...args);
    }

    static async readJSON(base_path, filename) {
        const config_path = path.join(base_path, filename || this.json_filename);
        try { return JSON.parse(await fs.readFile(config_path, "utf-8"));
        } catch (error){/* console.error("readJSON error", error); */}

        return {};
    }

    static async writeJSON(base_path, data, filename) {
        const config_path = path.join(base_path, filename || this.json_filename);
        return await fs.writeFile(config_path, stringifyJSON(data));
    }

    // expose the stringifyJSON function
    static async stringifyJSON(data) {
        return stringifyJSON(data);
    }



    static async addModDataToJSON(game_path, mod, file, entries, ignored_files, configPropName='mods', forcedRoot=null, extraProps={}) {
        const filter = entry => entry.outputPath && !ignored_files.includes(entry.entryName);
        const mapper = entry => entry.outputPath ?? entry.entryName;
        const config = await this.readJSON(game_path);
        config[configPropName] = config[configPropName] || {};
        config[configPropName][mod.mod_id] = {
            root: forcedRoot,
            version: file.version,
            file_id: file.file_id,
            file_name: file.file_name,
            entries: entries.filter(filter).map(mapper),
            ...extraProps,
        };
        return await this.writeJSON(game_path, config);
    }


    static async removeModDataFromJSON(game_path, mod, config_override=null, local=false) {
        const config = config_override ?? await this.readJSON(game_path);
        const modsprop = local ? 'local_mods' : 'mods';
        const idprop = local ? 'file_name' : 'mod_id';

        if (!config[modsprop] || !config[modsprop][mod[idprop]]) return [];
        console.log("removing mod", modsprop, idprop, mod[idprop], config[modsprop][mod[idprop]]);

        const clone = (d) => JSON.parse(JSON.stringify(d));
        const entries = clone(config[modsprop][mod[idprop]].entries);
        const root = config[modsprop][mod[idprop]].root;
        console.log('removing entries:', entries);
        config[modsprop][mod[idprop]] = null;
        delete config[modsprop][mod[idprop]];

        if (!config_override) await this.writeJSON(game_path, config);

        return {root, entries};
    }


    static async addModDataToCacheJSON(cache_path, mod, file) {
        const config = await this.readJSON(cache_path);
        const gameID = this._nexus.mBaseData.path.gameId;

        console.log("adding mod data to cache json", {cache_path, mod, file, gameID});
        config[gameID] = config[gameID] || {};
        // config.mods = config.mods || {};
        config[gameID][mod.mod_id] = {};
        config[gameID][mod.mod_id][file.file_id] = {
            ver: file.version,
            zip: file.file_name,
        };
        return await this.writeJSON(cache_path, config);
    }

    static async removeModDataFromCacheJSON(cache_path, mod, file) {
        const config = await this.readJSON(cache_path);
        const gameID = this._nexus.mBaseData.path.gameId;

        console.log("removing mod data from cache json", {cache_path, mod, file});
        if (!config[gameID] || !config[gameID][mod.mod_id]) return [];

        let entries = [];
        if (file) {
            if (!config[gameID][mod.mod_id][file.file_id]) return [];
            config[gameID][mod.mod_id][file.file_id] = null;
            delete config[gameID][mod.mod_id][file.file_id];
            if (Object.keys(config[gameID][mod.mod_id]).length === 0) {
                entries = Object.values(config[gameID][mod.mod_id]).map((entry) => entry.zip);
                config[gameID][mod.mod_id] = null;
                delete config[gameID][mod.mod_id];
            }
        } else {
            entries = Object.values(config[mod.mod_id]).map((entry) => entry.zip);
            config[gameID][mod.mod_id] = null;
            delete config[gameID][mod.mod_id];
        }

        await this.writeJSON(cache_path, config);
    }

    static async getUe4ssDataFromJSON(game_path) {
        const config = await this.readJSON(game_path);
        return config.ue4ss || {};
    }

    static async addUe4ssDataToJSON(game_path, ue4ss_data) {
        const config = await this.readJSON(game_path);
        config.ue4ss = ue4ss_data;
        return await this.writeJSON(game_path, config);
    }

    static async removeUe4ssDataFromJSON(game_path) {
        const config = await this.readJSON(game_path);
        delete config.ue4ss;
        return await this.writeJSON(game_path, config);
    }

    static async addUe4ssDataToCacheJSON(cache_path, key, ue4ss_data) {
        const config = await this.readJSON(cache_path);
        config.ue4ss = config.ue4ss || {};
        config.ue4ss[key] = ue4ss_data;
        return await this.writeJSON(cache_path, config);
    }

    static async removeUe4ssDataFromCacheJSON(cache_path, key) {
        const config = await this.readJSON(cache_path);
        delete config.ue4ss[key];
        return await this.writeJSON(cache_path, config);
    }

    static async uninstallFilesFromCache(cache_path, mod, file) {
        console.log('uninstalling files from cache', {cache_path, mod: mod.mod_id, file});
        // try {
        //     await this.uninstallMod(cache_path, mod);
        // } catch (error) {
        //     console.log("uninstallFilesFromCache", "failed to uninstall mod:", mod.name, error);
        // }
        await this.removeModDataFromCacheJSON(cache_path, mod, file);
        await fs.unlink(path.join(cache_path, file.file_name));
    }

    static launchExe(exe_path, args, opts={}) {
        console.log("launching exe", exe_path);
        // execFile(exe_path, args, (error, stdout, stderr) => {
        //     if (error) return console.error(`exec error: ${error}`);
        //     console.log(`stdout: ${stdout}`);
        //     console.error(`stderr: ${stderr}`);
        // });
        const gameProcess = spawn(exe_path, args);
        gameProcess.stdout.on('data', (data) => {
            console.log(`Stdout: ${data}`);
        });
        gameProcess.stderr.on('data', (data) => {
            console.error(`Stderr: ${data}`);
        });
        gameProcess.on('close', (code) => {
            console.log(`Process exited with code: ${code}`);
        });        

        return true;
    }

    static async fetchLatestUE4SSVersion() {
        // fetch the latest release from the UE4SS github repo
        const release_url = 'https://api.github.com/repos/UE4SS-RE/RE-UE4SS/releases/latest';
        return new Promise((resolve, reject) => {
            https.get(release_url, { headers: { 'User-Agent': 'Node.js' } }, (response) => {
                if (response.statusCode !== 200) {
                    return reject(new Error(`Failed to fetch latest UE4SS version (${response.statusCode})`));
                }
                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    try {
                        const releaseData = JSON.parse(data);
                        const version = releaseData.tag_name.replace('v', '');
                        const downloadUrl = releaseData.assets.find(asset => asset.name.includes(`UE4SS_v${version}.zip`))?.browser_download_url;
                        if (!downloadUrl) {
                            return reject(new Error('Download URL not found in release data'));
                        }
                        resolve({ version, downloadUrl });
                    } catch (error) {
                        reject(new Error(`Failed to parse release data: ${error.message}`));
                    }
                });
            }).on('error', (error) => {
                reject(new Error(`Failed to fetch latest UE4SS version: ${error.message}`));
            });
        });
    }
    static async fetchLatestExperimentalUE4SS() {
        const releaseUrl = "https://api.github.com/repos/UE4SS-RE/RE-UE4SS/releases/tags/experimental-latest";

        return new Promise((resolve, reject) => {
            https.get(releaseUrl, { headers: { "User-Agent": "Node.js" } }, (response) => {
                if (response.statusCode !== 200) {
                    return reject(new Error(`Failed to fetch UE4SS release (${response.statusCode})`));
                }

                let data = "";
                    response.on("data", (chunk) => {
                    data += chunk;
                });

                response.on("end", () => {
                    try {
                        const releaseData = JSON.parse(data);
                        const version = releaseData.tag_name?.replace(/^v/i, "") || "experimental";

                        // Find main ZIP asset (matches either UE4SS_v*.zip or zDEV*.zip)
                        const test = a => /\.zip$/i.test(a.name) && (a.name.startsWith("UE4SS_v") || a.name.includes("zDEV"));
                        const asset = releaseData.assets.find(test);

                        if (!asset) {
                            return reject(new Error("No suitable ZIP asset found in experimental release"));
                        }

                        resolve({
                            version,
                            downloadUrl: asset.browser_download_url
                        });
                    } catch (err) {
                        reject(new Error(`Failed to parse release data: ${err.message}`));
                    }
                });
            }).on("error", (err) => {
                reject(new Error(`Failed to fetch release info: ${err.message}`));
            });
        });
    }

    
    /**
     * Remove base path `a` from full path `b`
     * and return nested folders progressively,
     * each ending with a backslash.
     * The final file name in `b` is excluded.
     */
    static getNestedFolders(a, b) {
        const base = path.resolve(a);
        const full = path.resolve(b);

        if (!full.startsWith(base)) {
            throw new Error(`Path "${b}" is not inside base path "${a}"`);
        }

        const relative = path.relative(base, full);
        if (!relative) return [];

        const parts = relative.split(path.sep);

        return parts.map((part, i) => {
            const isFinal = i === parts.length - 1;
            if (isFinal) return parts.slice(0, i + 1).join(path.sep);
            return parts.slice(0, i + 1).join(path.sep) + path.sep;
        });
    }

    // downloads latest release from the UE4SS github repo
    // https://github.com/UE4SS-RE/RE-UE4SS/releases
    // https://github.com/UE4SS-RE/RE-UE4SS/releases/download/v3.0.1/UE4SS_v3.0.1.zip
    // https://github.com/UE4SS-RE/RE-UE4SS/releases/download/v3.0.1/UE4SS_v3.0.1.zip
    static async downloadAndInstallUE4SS(cache_dir, game_path, options) {
        // get latest release download url:
        // let ue4ss_version = null;
        let ue4ss_version = options.version ?? 'v3.0.1';
        const ue4ss_zip = options.zip ?? `UE4SS_${ue4ss_version}.zip`;
        const release_url = 'https://github.com/UE4SS-RE/RE-UE4SS/releases';
        let url = `${release_url}/download/${ue4ss_version}/${ue4ss_zip}`;

        // If the version is experimental-latest, fetch the latest experimental version
        // https://github.com/UE4SS-RE/RE-UE4SS/releases/tag/experimental-latest
        if (options.version === 'experimental-latest') {
            // fetch the latest experimental version
            try {
                const latestRelease = await this.fetchLatestExperimentalUE4SS();
                ue4ss_version = latestRelease.version;
                url = latestRelease.downloadUrl;
                console.log("Latest experimental UE4SS version:", ue4ss_version);
            } catch (error) {
                console.error("Failed to fetch latest experimental UE4SS version:", error);
                return false;
            }
        }
        else if (options.version === "custom") {
            ue4ss_version = options.version;
            url = options.url;
            console.log("Custom UE4SS version:", ue4ss_version);
            console.log("Custom UE4SS URL:", url);
        }

        try {
            const path_data = await this.validateGamePath(game_path);

            // remove dll from path if it exists
            const ue4ss_install_dir = path_data.ue4ss_path.replace('dwmapi.dll', '');

            console.log("downloading UE4SS from", url);
            console.log("installing to", ue4ss_install_dir);

            await this.downloadFile(cache_dir, url, {
                onProgress: data => Emitter.emit("ue4ss-process", 'download', data),
            });

            const ue4ss_filename = url.split("/").pop();
            await this.addUe4ssDataToCacheJSON(cache_dir, ue4ss_filename, url);

            // unzip and install
            const archive = new ArchiveHandler(path.join(cache_dir, ue4ss_filename));
            const ue4ss_entries = [];

            // forward the extracting event to the renderer
            archive.on("extracting", (data) => {
                Emitter.emit("ue4ss-process", 'extract', data);
                ue4ss_entries.push(data.outputPath);
            });

            // extract the zip to the game directory
            await archive.extractAllTo(ue4ss_install_dir, [], options.ignore_root_download_folder);

            await wait(250); // small wait to ensure extracting events have occurred before continuing.

            // for (const entry of archive.entries) {
            //     ue4ss_entries.push(path.join(ue4ss_install_dir, entry.entryName));
            // }

            // patchdata example:
            // { "Mods/BPModLoaderMod/Scripts/main.lua": "https://raw.githubusercontent.com/Okaetsu/RE-UE4SS/refs/heads/logicmod-temp-fix/assets/Mods/BPModLoaderMod/Scripts/main.lua" }
            for (const patchdata of options.patches) {
                for (const filetoreplace in patchdata) {
                    if (!Object.prototype.hasOwnProperty.call(patchdata, filetoreplace)) continue;
                    const url = patchdata[filetoreplace];
                    await this.downloadFile(cache_dir, url, {
                        onProgress: data => Emitter.emit("ue4ss-process", 'download', data),
                    });
                    const patchfile = path.join(cache_dir, url.split("/").pop());
                    const patchpath = path.join(game_path, filetoreplace);
                    const patch_folders = this.getNestedFolders(ue4ss_install_dir, patchpath);
                    // ue4ss_entries.push(patchpath, ...patch_folders);
                    ue4ss_entries.push(...patch_folders.map(folder => path.join(ue4ss_install_dir, folder)));

                    console.log("patching file:", patchfile, patchpath);
                    // ensure directory before copy:
                    await fs.mkdir(path.dirname(patchpath), { recursive: true });
                    await fs.copyFile(patchfile, patchpath);
                    Emitter.emit("ue4ss-process", 'patching', patchpath);
                }
            }

            // ue4ss_entries.sort((a, b) => b.length - a.length);
            await this.addUe4ssDataToJSON(game_path, {
                file: ue4ss_filename,
                entries: [...new Set(ue4ss_entries)],
            });

            Emitter.emit("ue4ss-process", 'complete', { success: true });

            return true;

        } catch (error) {
            Emitter.emit("ue4ss-process", 'error', error);
            console.error("downloadAndInstallUE4SS error", error);
        }
        return false;
    }

    // TESTING NEW METHOD FOR UNINSTALLING - REQUIRES NO ZIP AS DATA SAVED IN CACHE
    static async uninstallUE4SS(cache_dir, game_path, options) {
        const ue4ss_data = await this.getUe4ssDataFromJSON(game_path);
        const ue4ss_entries = ue4ss_data.entries;
        try {
            // sort entries by length (longest first)
            ue4ss_entries.sort((a, b) => b.length - a.length);
            // keep track of used entries
            const used_entries = [];
            // delete files (not directories)
            for (const entry of ue4ss_entries) {
                if ((await fs.stat(entry)).isDirectory()) continue;
                Emitter.emit("ue4ss-process", 'delete', entry);
                used_entries.push(entry);
                await fs.unlink(entry);
            }
            //  delete empty dirs:
            for (const entry of ue4ss_entries) {
                if (used_entries.includes(entry)) continue;
                if (!(await fs.stat(entry)).isDirectory()) continue;
                const files = await fs.readdir(entry);
                if (files.length) continue;

                console.log("deleting empty directory:", entry);
                await fs.rmdir(entry, { recursive: true });
            }
            await this.removeUe4ssDataFromJSON(game_path);
            Emitter.emit("ue4ss-process", 'uninstalled', { success: true });
            return true;
        } catch (error) {
            console.log("new ue4ss method uninstall error, maybe ue4ss was installed using previous version?");
            console.error("uninstallUE4SS error", error);
            return await this.DEPRECIATED_uninstallUE4SS(cache_dir, game_path, options);
        }
    }
    
    // CODE BELOW IS FUNCTIONAL BUT REQUIRES ZIP ARCHIVE TO DETERMINE ENTRIES
    static async DEPRECIATED_uninstallUE4SS(cache_dir, game_path, options) {
        try {
            const path_data = await this.validateGamePath(game_path);
            const ue4ss_install_dir = path_data.ue4ss_root;
            console.log("uninstalling UE4SS from", ue4ss_install_dir);

            let ue4ss_version = options.version ?? 'v3.0.1';
            const ue4ss_zip = options.zip ?? `UE4SS_${ue4ss_version}.zip`;

            const archive = new ArchiveHandler(path.join(cache_dir, options.zip ?? ue4ss_zip));
            const entries = await archive.getEntries();
            // remove each entry
            for (const entry of entries) {
                const fileordir = path.join(ue4ss_install_dir, entry.entryName);
                if (entry.isDirectory) {
                    // await fs.rmdir(fileordir, { recursive: true });
                } else {
                    Emitter.emit("ue4ss-process", 'delete', fileordir);
                    await fs.unlink(fileordir);
                }
            }
            // remove any patches
            for (const patchdata of options.patches) {
                for (const filetoreplace in patchdata) {
                    if (!Object.prototype.hasOwnProperty.call(patchdata, filetoreplace)) continue;
                    const patchpath = path.join(game_path, filetoreplace);
                    console.log("deleting patched file:", patchpath);
                    Emitter.emit("ue4ss-process", 'delete', patchpath);
                    try {
                        await fs.unlink(patchpath);
                    } catch (error) {
                        console.error("uninstallUE4SS error", error);
                    }
                }
            }
            
            Emitter.emit("ue4ss-process", 'uninstalled', { success: true });
            return true;
        } catch (error) {
            Emitter.emit("ue4ss-process", 'error', error);
            console.error("uninstallUE4SS error", error);
        }
        return false;
    }


    static watchForFileChanges(file_path) {
        watchFile(file_path, {interval: 250} , (curr, prev) => {
            const change_data = {path: file_path, curr, prev};
            const file_data = readFileSync(file_path, 'utf-8');
            Emitter.emit("watched-file-change", change_data, file_data);
        });
        // return () => unwatchFile(file_path);
    }
    static unwatchFileChanges(file_path) {
        unwatchFile(file_path);
    }


    static async getArchiveEntriesAsJSON(fullFilePath) {
        const archive = new ArchiveHandler(fullFilePath);
        return JSON.stringify(await archive.getEntries());
    }

    static async installAppSpecificMods(game_path, game_id) {
        const game_data = GAME_MAP[game_id];
        if (!game_data) return Promise.reject("Unknown game id");


        const root = DEAP.app.isPackaged ? process.resourcesPath : path.join(DEAP.app.getAppPath(), 'resources');
        const mods_root = path.join(root, `app-mods/${game_id}`)

        // await fs.copyFile(game_data.install_script, path.join(game_path, game_data.install_script.split("/").pop()));
        await fs.cp(mods_root, game_path, { recursive: true, force: true });
        console.log('installed app specific mods:', game_id);
    }


    static async backupFileForDelete(filePath) {
        const backupPath = `${filePath}.bak`;
        try {
            await fs.copyFile(filePath, backupPath);
            console.log(`Backup created at: ${backupPath}`);
            return backupPath;
        } catch (error) {
            console.error(`Failed to create backup for ${filePath}:`, error);
            throw error;
        }
    }
    static async restoreBackupFile(filePath) {
        const backupPath = `${filePath}.bak`;
        try {
            await fs.copyFile(backupPath, filePath);
            console.log(`Backup restored from: ${backupPath}`);
            // Optionally, delete the backup after restoring
            await fs.unlink(backupPath);
        } catch (error) {
            console.error(`Failed to restore backup for ${filePath}:`, error);
            throw error;
        }
    }



}
