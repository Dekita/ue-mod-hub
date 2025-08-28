<div align="center">
    <img style="max-height: 256px; width: auto;" src="resources/images/ue-mod-hub-palworld.png" title="Main Logo" />
    <div class="row" style="margin: 12px;">
        <img src="https://img.shields.io/github/downloads/Dekita/ue-mod-hub/total?style=for-the-badge&logo=github">
        <a class="mx-2" href="https://discord.gg/WyTdramBkm" target="new">
        <img src="https://img.shields.io/discord/1132980259596271657?logo=discord&style=for-the-badge&logoColor=e4e4e4&label=Support%20Server"></a>
        <img src="https://img.shields.io/github/stars/Dekita/ue-mod-hub?style=for-the-badge&logo=apache%20spark&logoColor=e4e4e4">
    </div>
</div>
<hr class="mt-1">

### What is UE Mod Hub
Originally launched as PalHUB Client with support exclusively for Palworld, UE Mod Hub has evolved into the ultimate mod management tool for Unreal Engine games. Designed to simplify modding, it enables players to easily manage their mods, save and load mod collections, and seamlessly view and install the required mods for modified servers—perfect for games with dedicated servers!

For server hosts, UE Mod Hub provides a hassle-free solution to streamline the mod setup process for your players. Share your server’s mod list, and users can install all necessary mods with just one click, saving time and frustration for everyone involved.

List your Palworld server in UE Mod Hub using the `UE Mod Hub (Server Listing Mod)` (contact me via discord for further details...).

| :exclamation: THIS APP IS IN BETA!! PLEASE REPORT ANY BUGS! |
|---|

<hr class="mt-1">

### Download Link & Install Guides
- [Download Latest Release](./releases)
- [How to Install App](./resources/readme/install.md)
- [Developer Build](./resources/readme/install-dev.md)
<hr class="mt-1">

### UE Mod Hub Features
- Painless Installation 
- Easily Navigable Modern UI 
- Support for PAK & LUA mods, Splash screen images, and BNK movie files
- Guided Setup After Install (w/Automatic Steam Game Path Detection)
- Download & Install Mods From [NexusMods](https://www.nexusmods.com/)
- Effortlessly manage your mod library and active mods with minimal clicks 
- Allows for listing modified servers, their required mods, Discord support servers, and additional information 
- Enables joining modified servers, downloading their required mod list, or joining their Discord support server
- Automatically join selected servers as the game launches (skips the title screen) 
- Automatic App Updates (UE Mod Hub will always be the latest version)
- Customizable Theme + Multiple Defaults 
- Optional Minimize to System Tray
- Optional Auto Minimize App on Launch
- Optional Auto Launch App on System Boot
- [TO-DO] Multi-Platform Support (Windows + Linux)
- [TO-DO] Optional Auto Play Game on Launch
- [TO-DO] System Notifications
<hr class="mt-1">

### Requirements
- An Unreal Engine game supported by UE Mod Hub (e.g., [Palworld](https://store.steampowered.com/app/1623730/Palworld/)) installed on your machine (Steam or Game Pass versions supported)
- A [NexusMods](https://www.nexusmods.com/) account to download mods via their API
- Windows PC (for release version; Linux/Mac can use developer builds directly with Node.js installed)
<hr class="mt-1">

### Supported Games
- Black Myth Wukong
- Final Fantasy VII Remake Integrade
- Final Fantasy VII Rebirth
- Hogwarts Legacy
- Lockdown Protocol
- Metal Gear Solid: Delta 
- More coming soon <3
- Orcs Must Die: Deathtrap
- Orcs Must die 3
- Palworld
- Palworld Server
- Stellar Blade
- Tekken 8
- The Killing Antidote
- ..More coming soon <3
<hr class="mt-1">

### Technical Details
- [Nextron](https://github.com/saltyshiomix/nextron) (Bundles Next.js with Electron)
    - [Electron](https://www.electronjs.org/)
    - [Next.js](https://nextjs.org/)
    - [React](https://react.dev/)
- [Nexus Mods](https://www.nexusmods.com/) (Enables mod downloads/updates) 
- Custom API Endpoints (For Server Listing / User Counts) [Palworld Only]
<hr class="mt-1">
