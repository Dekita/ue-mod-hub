/*
########################################
# PalHUB::Client by dekitarpg@gmail.com
########################################
*/
import React from 'react';
import DekCommonAppModal from '@components/core/modal';
import useScreenSize from '@hooks/useScreenSize';
import useCommonChecks from '@hooks/useCommonChecks';
import useLocalization from '@hooks/useLocalization';
import Ue4ssConfigurator from '@components/ue4ss-options';
import GameConfiguration from '@components/game-options';
import Carousel from 'react-bootstrap/Carousel';
import DekChoice from '@components/core/dek-choice';
import UE4SSInstallProgress from '@components/ue4ss-install';
import wait from '@utils/wait';

export default function GameConfigurationModal({ show, setShow, tempGame, setTempGame }) {
    const { requiredModulesLoaded, commonAppData, updateSelectedGame } = useCommonChecks();
    const [settingsPageID, setSettingsPageID] = React.useState(0);
    const { t, tA } = useLocalization();//'ue4ss');
    const { isDesktop } = useScreenSize();
    const fullscreen = !isDesktop;

    const cache_dir = commonAppData?.cache;
    // const api_key = commonAppData?.apis?.nexus;


    // const height = fullscreen ? 'calc(100vh - 182px)' : 'calc(100vh / 4 * 2 + 26px)';
    const height = fullscreen ? "calc(100vh - 96px)" : "calc(100vh / 4 * 2 + 26px)";

    const onCancel = React.useCallback(() => {
        setShow(false);
        setTimeout(() => {
            setSettingsPageID(0);
        }, 250);
    }, [setShow]);

    const onResetData = React.useCallback(() => {
        setHasChanges(false);
        setShowAdvanced(false);
    }, []);

    const runModloaderTask = React.useCallback(async (task) => {
        if (!requiredModulesLoaded || !tempGame) return;
        console.log('runModloaderTask:', task, tempGame);
        switch (task) {
            case 'install': {
                setSettingsPageID(2);
                const {modloader} = tempGame.map_data.platforms[tempGame.launch_type];
                if (modloader.ue4ss) {
                    await wait(1000);
                    await window.palhub('downloadAndInstallUE4SS', cache_dir, tempGame.path, modloader.ue4ss);
                    await updateSelectedGame(tempGame, setTempGame);
                } else {
                    throw Error('UE4SS path not provided');
                }
                break;
            }
            case 'uninstall': {
                setSettingsPageID(2);
                const {modloader} = tempGame.map_data.platforms[tempGame.launch_type];
                if (modloader?.ue4ss) {
                    await wait(1000);
                    await window.palhub('uninstallUE4SS', cache_dir, tempGame.path, modloader.ue4ss);
                    await updateSelectedGame(tempGame, setTempGame);
                } else {
                    throw Error('UE4SS path not provided');
                }
                break;
            }
            case 'update': {
                // await window.palhub('updateUE4SS', tempGame?.path);
                break;
            }
        }
    }, [requiredModulesLoaded, cache_dir, tempGame?.path]);

    const carouselOptions = React.useMemo(() => ({
        interval: null,
        controls: false,
        indicators: false,
        className: "container-fluid p-0",
        activeIndex: settingsPageID,
    }), [settingsPageID]);    

    // if (settings) console.log(settings);

    const isInstallingModloader = settingsPageID === 2;
    const headerText = isInstallingModloader ? t('modals.modloader.installing-ue4ss') : t('modals.game-config.head');
    const modalOptions = {show, setShow, onCancel, headerText, showX: !isInstallingModloader};
    return <DekCommonAppModal {...modalOptions}>
        <div type="DekBody" className='d-block overflow-y-auto pb-0' style={{height}}>
            {modalOptions.showX && <DekChoice
                disabled={!tempGame?.has_ue4ss}
                className="p-3"
                color='warning'
                active={settingsPageID}
                choices={tA('modals.game-config.tabs', 2)}
                onClick={(i, value) => setSettingsPageID(i)}
            />}
            <Carousel {...carouselOptions}>
                <Carousel.Item className="container-fluid px-3 pb-3">
                    <GameConfiguration {...{tempGame, setTempGame, runModloaderTask, setShow}} />
                </Carousel.Item>
                <Carousel.Item className="container-fluid px-3 pb-3">
                    <Ue4ssConfigurator game={tempGame} />
                </Carousel.Item>
                <Carousel.Item className="">
                    <UE4SSInstallProgress game={tempGame} onComplete={()=>setSettingsPageID(0)} />
                </Carousel.Item>
            </Carousel>
        </div>
    </DekCommonAppModal>;
}
