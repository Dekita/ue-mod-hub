
### TODO: 
- FIX: rename palhub.config files to modhub.config
- ensure sufficient space on drives for mod files for cache/install.
- the ability to add more than 1 version of a specific mod <3
- add optional symlink/direct copy options for deploying mods.
- variable install location when installing downloaded mod.
- ensure 'zCustomGameConfigs' is used for relevant games.
- add support for games listed in zCustomGameConfigs? 
- cleanup of files because omg they are a mess atm..
- make free user experience even more streamlined.
- let users select what files to install from a mod
- determine if any pak files edit the same asset? 
- properly setup github actions 
- sort options for mods


### v0.10.63
- Massive improvements to logic for how app installs ue4ss.
- Application now able to install custom versions of ue4ss.
- Added support for MGS: Delta.
- Small UI enhancements.


### v0.10.22
- Bugfix for certain bbcode from nexus causing render errors. 
- Added suggested mods for stellar blade


### v0.10.13
- Bugfix: for issue causing downloaded mods to not be displayed properly. 


### v0.10.12
- Bugfix: manually installed mods will again display popup window to uninstall. 
- Added options for Content/Movies and Content/Splash paths for manually install mods.


### v0.10.10
- Added button to select game folder path on Game & Modloader settings page, when adding new game to manage. 
- Bugfix: theme customization options re-enabled after bug caused them to not display. 
- Added "Get The Mod Hub App" button for discord rpc when modding stellar blade.
- Altered cache to retain basic data for mods hidden/removed after install. 
- Changed hidden mods to be shown when installed/downloaded. 
- Added button to uninstall/delete active hidden mods.
- Small positioning and layout improvements/fixes


### v0.10.3
- Added ErrorWrapper component, sourcemaps, and button to open browser console window for easier live debugging the client side error issue. 
- Small change to useActiveGame hook to hopefully solve some client side error issues. 


### v0.9.98
- Added `run-debug.bat` file + `UE Mod Hub Debug.txt` to assist in debugging live version
- Added support for bmp type splash screen mods with backup/restore of og file. 


### v0.9.91
- Added support for bk2 type movie file mods. 
- Added backup/restore functionality for movie file mods. 
- Bugfix: 8 mods should now be shown on latest/trending pages when available. 


### v0.9.83
- Changed display for mod files from using `file.file_name` to `file.name`.
- Bugfix: changed default app cache path to use documents folder instead. 
- Added support for Stellar Blade && Stellar Blade Demo.
- Added 'stellar' customization theme and bg images. 
- Small position improvements for some elements. 
- Small changes to 'Setup Help' page to update images. 
- Small text fixes


### v0.8.90
- Bugfix for certain files that should be placed into ~mods being placed into LogicMods. 
- Fixed issue of mod not opening correct page when clicking file link. (from modlist)


### v0.8.87
- Added redirect to settings for 'play' page when app not setup. 
- Fixed issue of mod not opening correct page when clicking file link. 


### v0.8.85
- Fix for 7z archives crashing the application (due to checking their pak file for logic mods)
- Hid servers tab from popup navbar (available when application window is small)
- Updated popup navbars description for about page. 
- Added option to disable/enable auto updates.
- Added BG images for some supported games. 
- Added orcs-must-die3 & deathtrap games. 
- Set user counter to update each hour.
- Changed theme selection design from beta. 
- Added changelog info to about page of app. 


### v0.8.75
- Fix for manually installed mods not showing unless 'downloaded mods' have also been added. 
- Fix for certain zip archives with logic mod pak file installing to ~mods folder rather than LogicMods. 
- Fix for mod pages not properly updating after a mod is added/removed
- Fix for locally installed mods popup not closing on uninstall mod


### v0.8.69
- Fixed issue of cache directory being incorrectly named on first boot. 
- Fixed issue of app not redirecting to settings page on first boot. 


### v0.8.68
- Fixed issue of zip archives with logic mod pak file installing to ~mods folder rather than LogicMods. 
(caused by archives that doesnt specify any root folder and contain only pak/utac/ucos/other files)
- Fixed issue of 'install ue4ss' not displaying when setting up managed game that supports it. 
- Fixed issue of games that have been moved directory since added to app causing crash/error.
(any game that doesnt seem validis now automatically removed from the applications data cache)
- Fixed issue of cache being reset each app boot. (only affected latest few versions of app)
- Fixed issue of user nexus avatar not immediately updating after entering api key.
- Fixed issue of 'Discord RPC' not updating status. 
- Disabled Logs->Application/Game selection when no ue4ss available for game logs.


### v0.8.36
- REBRANDED APP FROM `PalHUB Client` to `UE Mod Hub` due to now supporting multiple unreal engine games. 
- Moved default cache location to the folder that app is installed to.  
- Fixed issue of app not creating default cache folder on install.
- Fixed issue with 'View on Nexus Mods' button in mod details popup for newly supported games. 
- Fixed issue with FF7 Remake + Rebirth not launching from app (wanted launched via steam).
- Fixed issue with 'save ue4ss config' button causing crash. 
- Added 'ff7' and 'mako' themes for final fantasy 7 users. 
- Added 'Discord RPC' for the application.


### v0.7.20
- Added 'Supported Games' list to 'About' page.
- Added 'Change Background Visibility' setting.
- Added 'Show Archived Files' toggle for mod details popup.
- Changed selected background image to be game specific.
- Changed file 'download' button to open nexus mods file page for non-premium users.
- Changed 'servers' tab to only display for games that have known community servers.
- Changed 'Open Nexus Mods Links' to be enabled by default. 
- Improved various text elements, descriptions, faq's, etc. 
- Altered main body scrollbar to always show for element position consistency.
- Fixed issue with certain 7z archive structures (causing mods to install to wrong location)
- Fixed issue with all archive structures (where folders arent included in archive as entries)
- Fixed issue with ue4ss installation error on palworld servers (incorrect patch file path)
- Dramatically reduced overall installer & application size (~25%). <3
  - unpacked app size change: 434MB -> 326MB (24.88% reduction)
  - installer size change: 125MB -> 98MB (21.6% reduction)


### v0.6.90
- Unlocked 'servers' tab for listing modified steam servers (beta feature).
- Added app mods for steam palworld (for auto join dedicated server).
- Added app mods for steam palserver (for listing modified servers within PalHUB Client App).
- Added 'Setup Help' page to detail application setup for new users.
- Fixed issue causing 'Launch Palworld' button to not work correctly. 
- Various small code improvements + FAQ enhancements


### v0.6.80
- Added support for 7z archive types.
- Added ability to install mod from previously downloaded zip/rar/7z file.
- Added 'unmanage game' button to easily remove a specific game from being managed by palhub client. 
- Added support for nexus mods deep links (nxm links when using 'Download with manager' option on nexus).
- Fixed issue with updater text showing [object Object] (will only show correct text after this update).
- Fixed confusing visual issue where 'add new games to palhub' also showed a 'feature coming soon' text. 
- Fixed issue causing lua mods that are only packaged/zipped within their own mod folder, rather than a Mods, Win64, or Binaries root folder, to be incorrectly installed. 
- App now sets the cache directory to use the appdata folder by default (recommended to configure to a not appdata folder, but users kept putting their game path in there. hopefully this will help make it more clear.)
- Added multiple FAQs.


### v0.6.13
- Fixed issue where api key was being saved within application activity log. 


### v0.6.10
- Initial Release of application on Nexus Mods.
