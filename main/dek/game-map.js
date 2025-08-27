/*
* ########################################
* # PalHUB::Client by dekitarpg@gmail.com
* ########################################
list of unreal engine games, their steam game/server app id
(if they have one), and nexus mod id (if they have one)
*/

const KNOWN_PATCHES = {
    palworld_server: {
        "Pal/Binaries/Win64/Mods/BPModLoaderMod/Scripts/main.lua": "https://raw.githubusercontent.com/Okaetsu/RE-UE4SS/refs/heads/logicmod-temp-fix/assets/Mods/BPModLoaderMod/Scripts/main.lua"
    }
}

const UE4SS_SETTINGS_PRESETS = {
    palworld: {
        "General.bUseUObjectArrayCache": false,
    }
}

const KNOWN_MODLOADERS = {
    required_ue4ss: {version: "v3.0.1", required: true, patches: [], settings: {}},
    optional_ue4ss: {version: "v3.0.1", required: false,patches: [], settings: {}},
    experimental_ue4ss: {version: "experimental-latest", zip: "UE4SS_v3.0.1-420-g8e08d13.zip", required: false, patches: [], settings: {}},
}

// FORMAT: 
// "generic": {
//     is_hidden: true, // only shown in dev mode
//     providers: { // list of mod store providers
//         nexus: "providerslug", 
//         other: "otherslug" 
//     },
//     platforms: { // list of game store platforms 
//         game: {  // game store ids for each platform the main game is available on
//             steam: {id: "1234567", root: "UEProjectRoot", app: "AppExeName", url: true}, // url=true to open game using steam appid url
//             epic: null, 
//             xbox: null,
//             modloader: { // list of compatible modlaoders to use with the game
//                 ue4ss: {version: "3.0.1", patches: []}, // use UE4SS mod loader
//                 other: {provider: "other", id: "1234567"} // use other mod loader from provider
//             }                
//         },
//         server: { // dedicated server store ids for each platform the server is available on
//             steam: {id: "7654321", root: "UEProjectRoot", app: "ServerExeName"}, 
//             epic: null, 
//             xbox: null, 
//             mod: { // community mod to create/host dedicated servers
//                 provider: null, 
//                 id: null
//             },
//             modloader: { // list of compatible modlaoders to use with the game SERVER
//                 ue4ss: {version: "3.0.1", patches: []}, // use UE4SS mod loader
//                 other: {provider: "other", id: "1234567"} // use other mod loader from provider
//             }                
//         },
//     },
// },




const STELLARBLADE = {
    providers: {
        nexus: "stellarblade"
    },
    platforms: {
        demo: {
            steam: {id: "3564860", root: "SB", app: "SB", match: /\/StellarBladeDemo/i, url: true},
            // modloader: {ue4ss: KNOWN_MODLOADERS.optional_ue4ss}
        },
        game: {
            steam: {id: "3489700", root: "SB", app: "SB", url: true},
            // modloader: {ue4ss: KNOWN_MODLOADERS.optional_ue4ss}
        },
    },
}

// const STELLARBLADEDEMO = { ...STELLARBLADE };
// STELLARBLADEDEMO.platforms.game.steam.id = "3564860";//"1294088";


const PALWORLD = {
    providers: {
        nexus: "palworld"
    },
    platforms: {
        game: {
            steam: {id: "1623730", root: "Pal", app: "Palworld"},
            xbox: {id: null, root: "Pal", app: "gamelaunchhelper"},
            modloader: {ue4ss: {
                ...KNOWN_MODLOADERS.required_ue4ss, 
                settings: UE4SS_SETTINGS_PRESETS.palworld
            }}
        },
        server: {
            steam: {id: "2394010", root: "PalServer", app: "PalServer"},
            modloader: {ue4ss: {
                ...KNOWN_MODLOADERS.required_ue4ss, 
                patches: [KNOWN_PATCHES.palworld_server], 
                settings: UE4SS_SETTINGS_PRESETS.palworld
            }}
        },
    },
}

const FF7REMAKE =  {
    providers: {
        nexus: "finalfantasy7remake"
    },
    platforms: {
        game: {
            steam: {id: "1462040", root: "End", app: "ff7remake", url: true},
            // modloader: {ue4ss: KNOWN_MODLOADERS.optional_ue4ss}
        }
    },
}

const FF7REBIRTH = {
    providers: {
        nexus: "finalfantasy7rebirth"
    },
    platforms: {
        game: {
            steam: {id: "2909400", root: "End", app: "ff7rebirth", url: true},
            // modloader: {ue4ss: KNOWN_MODLOADERS.optional_ue4ss}
        }
    },
}

const HOGWARTSLEGACY = {
    providers: {
        nexus: "hogwartslegacy"
    },
    platforms: {
        game: {
            steam: {id: "1554650", root: "Phoenix", app: "HogwartsLegacy"},
            modloader: {ue4ss: KNOWN_MODLOADERS.optional_ue4ss}
        }
    },
}

const BLACKMYTHWUKONG = {
    providers: {
        nexus: "blackmythwukong"
    },
    platforms: {
        game: {
            steam: {id: "2358720", root: "b1", app: "b1"},
            modloader: {ue4ss: KNOWN_MODLOADERS.optional_ue4ss}
        }
    },
}

const LOCKDOWNPROTOCOL = {
    providers: {
        nexus: "lockdownprotocol"
    },
    platforms: {
        game: {
            steam: {id: "1683320", root: "LockdownProtocol", app: "LockdownProtocol"},
            modloader: {ue4ss: KNOWN_MODLOADERS.optional_ue4ss}
        }
    },
}

const TEKKEN8 = {
    providers: {
        nexus: "tekken8"
    },
    platforms: {
        game: {
            steam: {id: "2385860", root: "Polaris", app: "Polaris-Win64-Shipping"},
            modloader: {ue4ss: KNOWN_MODLOADERS.optional_ue4ss}
        }
    },
}

const ORCSMUSTDIE3 = {
    providers: {
        nexus: "orcsmustdie3"
    },
    platforms: {
        game: {
            steam: {id: "1029890", root: "OMD", app: "Orcs Must Die! 3"},
            modloader: {ue4ss: KNOWN_MODLOADERS.optional_ue4ss}
        }
    },
}
const ORCSMUSTDIEDEATHTRAP = {
    providers: {
        nexus: "orcsmustdiedeathtrap"
    },
    platforms: {
        game: {
            steam: {id: "2273980", root: "OMD", app: "OMD-Win64-Shipping"},
            modloader: {ue4ss: KNOWN_MODLOADERS.optional_ue4ss}
        }
    },
}

const SATISFACTORY = {
    is_hidden: true, 
    providers: {
        nexus: "satisfactory"
    },
    platforms: {
        game: {
            steam: {id: "526870", root: "FactoryGame", app: "FactoryGameSteam"},
            modloader: {ue4ss: KNOWN_MODLOADERS.optional_ue4ss}
        }
    },
}


const THEKILLINGANTIDOTE = {
    providers: {
        nexus: "thekillingantidote"
    },
    platforms: {
        game: {
            steam: {id: "2254890", root: "TheKillingAntidote", app: "TheKillingAntidote"},
            modloader: {ue4ss: KNOWN_MODLOADERS.optional_ue4ss}
        }
    },
}

const MGS_DELTA = {
    providers: {
        nexus: "metalgearsoliddeltasnakeeater"
    },
    platforms: {
        game: {
            steam: {id: "2417610", root: "MGSDelta", app: "MGSDelta"},
            // modloader: {ue4ss: KNOWN_MODLOADERS.optional_ue4ss}
        }
    },
}



export default {
    "palworld": PALWORLD,
    "ff7remake": FF7REMAKE,
    "ff7rebirth": FF7REBIRTH,
    "hogwarts-legacy": HOGWARTSLEGACY,
    "black-myth-wukong": BLACKMYTHWUKONG,
    "lockdown-protocol": LOCKDOWNPROTOCOL,
    "orcs-must-die-3": ORCSMUSTDIE3,
    "orcs-must-die-deathtrap": ORCSMUSTDIEDEATHTRAP,
    // "satisfactory": SATISFACTORY,
    "stellar-blade": STELLARBLADE,
    // "stellar-blade-demo": STELLARBLADEDEMO,
    "tekken8": TEKKEN8,
    "the-killing-antidote": THEKILLINGANTIDOTE,
    "mgs-delta": MGS_DELTA,
}
