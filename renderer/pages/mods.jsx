/*
########################################
# PalHUB::Client by dekitarpg@gmail.com
########################################
*/
import React from 'react';
import Link from 'next/link';
// import Image from 'next/image'


import ModCardComponent from '../components/mod-card';

import { ENVEntry, ENVEntryLabel } from '@components/modals/common';
// import DekSelect from '@components/core/dek-select';
import DekChoice from "@components/core/dek-choice";
// import DekCheckbox from '@components/core/dek-checkbox';

import CheckModsModal from '@components/modals/mod-check';
import ModDetailsModal from '@components/modals/mod-details';
import AddLocalModModal from '@components/modals/local-mod';
// import ModListModal from '@components/modals/mod-list';
import Image from 'react-bootstrap/Image';
import Carousel from 'react-bootstrap/Carousel';
import BBCodeRenderer from "@components/core/bbcode";
import { useRouter } from 'next/router';

import * as CommonIcons from '@config/common-icons';
import useLocalization from '@hooks/useLocalization';
import useCommonChecks from '@hooks/useCommonChecks';


/**
{
    "name": "Quivern Rainbowdragon",
    "summary": "New look with colorful feathers for the Quivern :D",
    "description": "[center][size=4]This mod is a commission together with the Chillet, and its goal was to redesign the Quivern based on an existing character. The mod adds ears, colorful feathers, horns, and paws[/size]\n<br />\n<br />[size=5]Installation[/size]\n<br />\n<br />[size=3]Unpack the zip and drop on  \"...Palworld&#92;Content&#92;Pal&#92;Content&#92;Paks\" or \"~Mods\" folder. [/size]\n<br />\n<br />[url=https://www.nexusmods.com/palworld/search/?gsearch=ddarckwolf&amp;gsearchtype=authors&amp;tab=mods]\n<br />\n<br />[size=6][u]My Other Mods :D\n<br />[/u][/size][/url]\n<br />\n<br />[url=https://ko-fi.com/ddarckwolf]\n<br />[img]https://ko-fi.com/img/githubbutton_sm.svg[/img]\n<br />\n<br />\n<br />[/url]\n<br />[url=https://www.buymeacoffee.com/ddarckwolf][img]https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png[/img]\n<br />[/url][/center]",
    "picture_url": "https://staticdelivery.nexusmods.com/mods/6063/images/1678/1678-1720655960-891455967.png",
    "mod_downloads": 0,
    "mod_unique_downloads": 0,
    "uid": 26040386717326,
    "mod_id": 1678,
    "game_id": 6063,
    "allow_rating": true,
    "domain_name": "palworld",
    "category_id": 10,
    "version": "v1.0",
    "endorsement_count": 0,
    "created_timestamp": 1720656865,
    "created_time": "2024-07-11T00:14:25.000+00:00",
    "updated_timestamp": 1720656865,
    "updated_time": "2024-07-11T00:14:25.000+00:00",
    "author": "Ddarckwolf",
    "uploaded_by": "Ddwolf11",
    "uploaded_users_profile_url": "https://www.nexusmods.com/users/72870268",
    "contains_adult_content": false,
    "status": "published",
    "available": true,
    "user": {
        "member_id": 72870268,
        "member_group_id": 27,
        "name": "Ddwolf11"
    },
    "endorsement": null
}
*/

const BANNED_MODS = [];

function determineAdvertizedMods(slug) {
    switch (slug) {
        case 'palworld': return [577, 703, 1204, 146, 489];//1650, 487, 577, 489]//, 1204];//, 1314, 1650, 1640];
        case 'hogwarts-legacy': return [1260, 1261, 1275, 1179];
        case 'stellar-blade': return [1496, 630, 340, 488, 489, 531];
    }
    return [];
}

export default function ModsPage() {
    const router = useRouter();
    const { t, tA } = useLocalization();
    const { requiredModulesLoaded, commonAppData } = useCommonChecks();
    const cache_dir = commonAppData?.cache;
    const game_path = commonAppData?.selectedGame?.path;
    const game_data = commonAppData?.selectedGame;
    const api_key = commonAppData?.apis?.nexus;
    const slug = game_data?.map_data?.providers?.nexus;


    const [needsRefreshed, setNeedsRefreshed] = React.useState(false);
    const [showAddLocalMod, setShowAddLocalMod] = React.useState(false);
    const [showModDetails, setShowModDetails] = React.useState(false);
    const [showModList, setShowModList] = React.useState(false);
    const [activeMod, setActiveMod] = React.useState(null);
    const [localMod, setLocalMod] = React.useState(null);
    const [modlistID, setModlistID] = React.useState(0);
    const [mods, setMods] = React.useState([]);
    const [localMods, setLocalMods] = React.useState([]);
    const [ads, setAds] = React.useState([]);
    const modlistTypes = tA('/mods.tabs', 5) ?? [];
    const modSearchRef = React.useRef(null);
    
    const showSaveModList = modlistID === 0;
    // https://www.nexusmods.com/palworld/mods/1204
    const advertised_mods = determineAdvertizedMods(commonAppData?.selectedGame?.id);

    // React.useEffect(() => {
    //     if (!requiredModulesLoaded) return;
    //     redirectIfNeedConfigured();
    // }, [requiredModulesLoaded]);

    const getInstalledMods = async (api_key, game_path) => {
        const config = await window.palhub('readJSON', game_path);
        if (!config || (!config.mods && !config.local_mods)) return [];
        const mod_ids = Object.keys(config.mods ?? {});
        const mods_from_nexus = await Promise.all(mod_ids.map(async mod_id => {
            const nexus_data = await window.nexus(api_key, 'getModInfo', mod_id, slug);
            nexus_data.saved_config = config.mods[mod_id];
            nexus_data.installed = true;
            return nexus_data;
        }));

        console.log('config.mods:', config.mods);
        if (!config.local_mods) return mods_from_nexus;
        const local_mods = Object.values(config.local_mods).filter(mod => mod.local);
        console.log('local_mods:', local_mods);
        return mods_from_nexus.concat(local_mods);
    }

    const getDownloadedMods = React.useCallback(async (api_key, cache_dir) => {
        console.log('cache_dir:', cache_dir, slug);
        // const install_config = await window.palhub('readJSON', game_path);
        const config = await window.palhub('readJSON', cache_dir);
        const mod_ids = Object.keys(config[slug] ?? {});
        return await Promise.all(mod_ids.map(async mod_id => {
            const nexus_data = await window.nexus(api_key, 'getModInfo', mod_id, slug);
            console.log('setting nexus_data:', config[slug][mod_id]);
            const saved_keys = Object.keys(config[slug][mod_id]);
            if (saved_keys.length) nexus_data.saved_config = {
                file_id: saved_keys[0],
                file_name: config[slug][mod_id][saved_keys[0]].zip,
                mod_id: mod_id,
            }
            // nexus_data.saved_config = install_config.mods[mod_id];
            // nexus_data.installed = nexus_data.saved_config ? true : false;
            return nexus_data;
        }));
    }, [game_path, cache_dir, commonAppData?.selectedGame?.id]);

    // load initial settings from store
    React.useEffect(() => {
        if (!requiredModulesLoaded) return;
        (async () => {
            let new_mods = null;
            // // const api_key = await getApiKey();
            // // const game_path = await getGamePath();
            // // const cache_dir = await getCacheDir();
            // const cache_dir = commonAppData?.cache;
            // const game_path = commonAppData?.selectedGame?.game?.path;
            // const game_data = commonAppData?.selectedGame?.data;
            // const api_key = commonAppData?.apis?.nexus;

            switch (modlistID) { 
                case 0: new_mods = await getInstalledMods(api_key, game_path); break;
                case 1: new_mods = await getDownloadedMods(api_key, cache_dir); break;
                case 2: new_mods = await window.nexus(api_key, 'getLatestAdded', slug); break;
                case 3: new_mods = await window.nexus(api_key, 'getTrending', slug); break;
                case 4: new_mods = await window.nexus(api_key, 'getLatestUpdated', slug); break;
                case 5: new_mods = await window.nexus(api_key, 'getTrackedMods'); break;
            }
            if (new_mods) {

                let new_ads = await Promise.all(advertised_mods.map(async mod_id => {
                    return await window.nexus(api_key, 'getModInfo', mod_id, slug);
                }));

                const nexusValidationFilter = (mod) => {
                    // console.log('nexusValidationFilter:', mod);
                    // return true;
                    if (!mod || !mod.status) return false;
                    return mod.status === 'published' && mod.available;
                }
                
                new_ads = new_ads.filter(nexusValidationFilter).map(mod => {
                    mod.ad = true;
                    return mod;
                });

                const new_locals = new_mods.filter(mod => mod.local);
                if (modlistID > 1) {
                    new_mods = new_mods.filter(nexusValidationFilter)
                }
                console.log({new_mods})

                if (![0, 1].includes(modlistID)) {
                    if (new_mods.length >= 8) new_mods = new_mods.slice(0, 8);
                    else if (new_mods.length > 4) new_mods = new_mods.slice(0, 4);
                }
                setAds(new_ads);
                setMods(new_mods);
                setLocalMods(new_locals);
                setNeedsRefreshed(false);
            }
        })();
    }, [modlistID, requiredModulesLoaded, needsRefreshed]);

    const onClickModCard = (mod) => {
        console.log('clicked mod:', mod);
        setActiveMod(mod);
        setShowModDetails(true);
    }
    const onClickLocalModCard = (mod) => {
        console.log('clicked local mod:', mod);
        setLocalMod(mod);
        setShowAddLocalMod(true);
    }
    const onToggleShowLocalModCard = (show) => {
        setShowAddLocalMod(show);
        if (show) return;
        setTimeout(() => {
            setLocalMod(null);
        }, 500);
    }

    const onFindSpecificMod = React.useCallback(async () => {
        const value = modSearchRef.current.value;
        let mod_id = null;
        // if value is valid number then it is considered as mod id:
        if (parseInt(value)) mod_id = parseInt(value);
        // if value is https://www.nexusmods.com/palworld/mods/MOD_ID then get the mod_id using regex
        if (value.includes('nexusmods.com')) {
            const match = value.match(/mods\/(\d+)/);
            if (match) mod_id = match[1];
        }
        // console.log('finding specific mod:', mod_id);
        if (!mod_id) return console.error('Invalid mod id or url');
        if (!window.uStore) return console.error('uStore not loaded');
        if (!window.nexus) return console.error('nexus not loaded');
        // const cache_dir = commonAppData?.cache;
        // const game_path = commonAppData?.selectedGame?.game?.path;
        // const game_data = commonAppData?.selectedGame?.data;
        // const api_key = commonAppData?.apis?.nexus;

        // const api_key = await getApiKey();
        const mod = await window.nexus(api_key, 'getModInfo', mod_id, slug);
        onClickModCard(mod);
    }, [modSearchRef, commonAppData?.selectedGame?.id]);

    const refreshModList = React.useCallback(()=>{
        setNeedsRefreshed(true);
    }, []);

    
    const gold_mod = false;
    const banner_height = 256;
    const color_a = gold_mod ? 'danger' : 'info';
    const color_b = gold_mod ? 'warning' : 'primary';
    const gradient_a = `bg-gradient-${color_a}-to-${color_b} border-${color_a}`;
    const gradient_b = `bg-${color_b} border-${color_a}`;
    const gradient_c = `bg-gradient-${color_b}-to-${color_a} border-${color_a}`;

    return <React.Fragment>
        <CheckModsModal show={showModList} setShow={setShowModList} />
        {/* <ModListModal show={showModList} setShow={setShowModList} mods={mods} /> */}
        <ModDetailsModal mod={activeMod} show={showModDetails} setShow={setShowModDetails} refreshModList={refreshModList}/>
        <AddLocalModModal show={showAddLocalMod} setShow={onToggleShowLocalModCard} initialModData={localMod} refreshModList={refreshModList}/>

        <div className="container">
            <div className="mx-auto px-3 py-5">
                
                {ads && ads.length > 0 && <div className='position-relative'>
                    {/* main gradient background elements */}
                    <div className='row mb-2'  style={{height: banner_height}}>
                        <div className={`col transition-all border border-4 border-end-0 p-5 radius9 no-radius-end ${gradient_a}`}></div>
                        <div className={`col transition-all border border-4 border-start-0 border-end-0 p-5 ${gradient_b}`}></div>
                        <div className={`col transition-all border border-4 border-start-0 p-5 radius9 no-radius-start ${gradient_c}`}></div>
                    </div>
                    {/* actual content elements */}
                    <div className='position-absolute top-0 w-100 pt-3'>
                        
                        <div className='d-flex text-center'>
                            {/* create carousel with each ad as the items */}
                            <Carousel interval={6900} className='w-100' indicators={true} style={{height: 234}}>
                                {ads.map((mod, i) => {
                                    return <Carousel.Item key={i} className='h-100'>
                                        <div className='container-fluid h-100'>
                                            <div className='row mx-auto bg-dark cursor-pointer radius6 h-100' style={{maxWidth: 800}} onClick={()=>onClickModCard(mod)}>
                                                <div className='col-12 col-lg-6 ps-lg-0 text-center'>
                                                    <div className='position-relative h-100'>
                                                        {/* <div className='d-flex justify-content-center align-items-center'> */}
                                                            <Image src={mod.picture_url} alt={mod.name} fluid 
                                                                className='bg-transparent position-absolute top-50 start-50 ps-3' 
                                                                style={{ maxHeight: banner_height-56, transform: 'translate(-50%, -50%)' }}
                                                            />
                                                        {/* </div> */}
                                                        {/* <div className='d-lg-none py-3 text-center w-100 position-absolute top-0'>
                                                            <h2 className='text-white bg-dark'>{mod.name}</h2>
                                                        </div> */}
                                                    </div>
                                                </div>
                                                <div className='d-none d-lg-block col-12 col-lg-6 ps-lg-0 h-100 py-3 text-start'>
                                                    <h3 className='text-white mb-0'><strong>{mod.name}</strong></h3>
                                                    <small className='text-white'><strong>by {mod.author}</strong></small>
                                                    <hr className='my-3'/>
                                                    <BBCodeRenderer bbcodeText={mod.summary} />
                                                </div>
                                            </div>
                                        </div>
                                    </Carousel.Item>
                                })}
                            </Carousel>
                        </div>

                    </div>
                </div>}

                <div className='row'>
                    <div className='col text-end d-flex flex-column px-3'>
                        <small>
                            {t('/mods.powered')} <Link href="https://nexusmods.com" target='_blank' className='hover-dark text-warning'>{t('common.nexus')}</Link>
                        </small>
                    </div>
                </div>

                <div className='row pt-2'>
                    {showSaveModList && <div className='col-3 pe-0'>
                        <button 
                            className='btn btn-primary w-100'
                            onClick={() => setShowModList(true)}>
                            {t('/mods.save-list')}
                        </button>
                    </div>}
                    <div className='col-3'>
                        <button 
                            className='btn btn-info w-100'
                            onClick={() => setShowAddLocalMod(true)}>
                            {t('/mods.add-local')}
                        </button>
                    </div>
                    <div className='col ps-0'>
                        {/* <ENVEntryLabel name="View mod by id or url" tooltip="Enter a nexus mods url or nexus mod id to view a specific mod." /> */}
                        <div className="input-group">
                            <input 
                                type='text'
                                placeholder={t('/mods.search-placeholder')}
                                className='form-control form-primary no-radius-end' 
                                autoComplete="off"
                                ref={modSearchRef}
                            />
                            <div className="input-group-append">
                                <button className="btn btn-primary no-radius-start px-4" type="button" onClick={onFindSpecificMod}>
                                    <strong>{t('/mods.search-button')}</strong>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <DekChoice 
                    className='py-3'
                    // disabled={true}
                    choices={modlistTypes}
                    active={modlistID}
                    onClick={(i,value)=>{
                        console.log(`Setting Page: ${value}`)
                        setModlistID(i);
                    }}
                />                

                <div className="row mt-3">
                    {mods && mods.map((mod, i) => <ModCardComponent key={i} {...{mod, modlistID, refreshModList}} onClick={onClickModCard} />)}
                </div>
                {localMods.length > 0 && <div className="row mt-3">
                    <h4 className='text-start'>{t('/mods.manual-mods')}</h4>
                    {localMods.map((mod, i) => <ModCardComponent key={i} mod={mod} onClick={onClickLocalModCard} local={true} />)}
                </div>}
            </div>
        </div>
    </React.Fragment>
}
