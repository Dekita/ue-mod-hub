/*
########################################
# PalHUB::Client by dekitarpg@gmail.com
########################################
* Handles zip/rar archives
*/
// import { app } from "electron";
import DEAP from "./deap";

import path from 'path';
import fs from 'fs/promises';
import AdmZip from 'adm-zip'; // for de-zip
import { createExtractorFromData } from 'node-unrar-js'; // for de-rar
// import SevenZip from '7zip-min'; 
import SevenZip from './7zip-min-override'; 

import EventEmitter from "events";

class ArchiveHandler extends EventEmitter {
    constructor(filePath) {
        super();
        this.filePath = filePath;
        this.extension = path.extname(filePath).toLowerCase();
        this.entries = [];
    }

    async _loadEntries() {
        try {
            if (this.extension === '.zip') {
                this._loadZipEntries();
            } else if (this.extension === '.rar') {
                await this._loadRarEntries();
            } else if (this.extension === '.7z') {
                await this._load7zEntries();
            } else {
                throw new Error('Unsupported file format');
            }
        } catch (error) {
            console.error(error);
        }
    }

    _loadZipEntries() {
        const zip = new AdmZip(this.filePath);
        // this.entries = zip.getEntries().map(entry => ({
        //     entryName: entry.entryName,
        //     isDirectory: entry.isDirectory,
        //     size: entry.header.size,
        //     getData: () => entry.getData(),
        // }));

        // Initialize a set to track all directories
        const directories = new Set();

        // Map entries and infer directories from file paths
        this.entries = zip.getEntries().map(entry => {
            const entryName = entry.entryName;

            // Add parent directories for each entry
            const parts = entryName.split("/");
            for (let i = 1; i < parts.length; i++) {
                directories.add(parts.slice(0, i).join("/") + "/");
            }

            return {
                entryName,
                isDirectory: entry.isDirectory,
                size: entry.header.size,
                getData: () => entry.getData(),
            };
        });

        // Add explicit directory entries
        for (const dir of directories) {
            if (this.entries.some(e => e.entryName === dir)) continue;
            this.entries.push({
                entryName: dir,
                isDirectory: true,
                size: 0,
                getData: () => Buffer.alloc(0), // Empty data for directories
            });
        }

        // Sort entries for consistent order (optional)
        this.entries.sort((a, b) => a.entryName.localeCompare(b.entryName));
    }

    // https://www.npmjs.com/package/node-unrar-js
    async _loadRarEntries() {
        const filedata = await fs.readFile(this.filePath);
        const buffer = Uint8Array.from(filedata).buffer;
        const extractor = await createExtractorFromData({data: buffer});
        // const list = extractor.getFileList();
        // const listArcHeader = list.arcHeader; // archive header
        // const fileHeaders = [...list.fileHeaders]; // load the file headers        
        const extracted = extractor.extract();
        const files = [...extracted.files]; //load the files

        this.entries = files.map(entry => ({
            entryName: entry.fileHeader.name,
            isDirectory: entry.fileHeader.flags.directory,
            size: entry.fileHeader.unpSize,
            getData: () => entry.extraction,
        }));
    }


    async _load7zEntries() {
        return new Promise((resolve, reject) => {
            const entries = [];
            SevenZip.list(this.filePath, (err, result) => {
                if (err) return reject(err);
    
                result.forEach((entry) => {
                    entries.push({
                        entryName: entry.attr.includes('D') ? `${entry.name}/` : entry.name,
                        isDirectory: entry.attr.includes('D'),
                        size: entry.size,
                        getData: async () => await this._extract7zEntry(entry.name),
                    });
                });
    
                this.entries = entries;
                resolve();
            });
        });
    }
    
    async _extract7zEntry(entryName) {
        return new Promise((resolve, reject) => {
            const tempOutputDir = path.join(DEAP.app.getPath('userData'), 'TempExtract');
            const tempFilePath = path.join(tempOutputDir, entryName);
    
            SevenZip.unpack(this.filePath, tempOutputDir, (err) => {
                if (err) {
                    DEAP.logger.error('Error extracting 7z entry:', err);
                    return reject(err);
                }
    
                fs.readFile(tempFilePath)
                    .then((buffer) => {
                        resolve(buffer);
                        // Optionally clean up temp files here if needed
                        fs.unlink(tempFilePath);
                    })
                    .catch(reject);
            });

        });
    }

    async getEntries() {
        if (this.entries.length === 0) {
            await this._loadEntries();
        }
        return this.entries;
    }

    async extractEntry(entry, outputPath, ignored_segment=null) {
        // if (!!!entry.outputPath) return;

        const entryPath = entry.outputPath ?? entry.entryName;
        const finalEntryPath = ignored_segment ? entryPath.replace(ignored_segment, '') : entryPath;
        const outputFilePath = path.join(outputPath, finalEntryPath);
        console.log('extracting:', entry.entryName, 'to:', outputFilePath);

        this.emit('extracting', {
            entry: entry.entryName,
            outputPath: outputFilePath,
        });

        if (entry.isDirectory) {
            await fs.mkdir(outputFilePath, { recursive: true });
        } else {
            await fs.mkdir(path.dirname(outputFilePath), { recursive: true });
            await fs.writeFile(outputFilePath, await entry.getData());
        }
    }

    async extractAllTo(outputPath, ignores = [], ignore_root=false) {
        console.log('extracting to:', outputPath);
        const entries = await this.getEntries();
        // console.log('got entries:', entries);
        let ignored_segment=null;
        if (ignore_root) {
            ignored_segment = entries.shift().entryName;
            console.log('ignoring root folder segment:', ignored_segment);
        }
        for (const entry of entries) {
            if (ignores.includes(entry.entryName)) {
                console.log('ignoring:', entry.entryName);
                continue;
            }
            await this.extractEntry(entry, outputPath, ignored_segment);
        }
        this.emit('extracted', {
            entries,
            outputPath,
        });        
    }
}

export default ArchiveHandler;
