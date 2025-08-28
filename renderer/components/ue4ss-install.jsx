/*
########################################
# PalHUB::Client by dekitarpg@gmail.com
########################################
*/

import React from 'react';
import useScreenSize from '@hooks/useScreenSize';
import useLocalization from '@hooks/useLocalization';
import replaceUe4ssIniKeyValue from 'utils/replaceIniKey';
import wait from '@utils/wait';
import useCommonChecks from '@hooks/useCommonChecks';

export default function UE4SSInstallProgress({ game, onComplete }) {
    const { requiredModulesLoaded } = useCommonChecks();
    const { t, tA } = useLocalization();

    const { isDesktop } = useScreenSize();
    const fullscreen = !isDesktop;

    // const height = fullscreen ? 'calc(100vh - 182px)' : '352px';
    // const height = fullscreen ? 'calc(100vh - 182px)' : 'calc(100vh / 4 * 2 + 26px)';
    const height = fullscreen ? "calc(100vh - 96px)" : "calc(100vh / 4 * 2 + 26px)";

    const logRef = React.useRef(null);

    const [logMessages, setLogMessages] = React.useState([]);

    const addLogMessage = (message) => {
        setLogMessages((old) => [...old, message]);
        if (logRef.current) {
            setTimeout(() => (logRef.current.scrollTop = logRef.current.scrollHeight));
            // logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    };

    const resetLogMessages = React.useCallback(() => {
        setLogMessages([]);
    }, []);

    const onFinished = React.useCallback(async () => {
        await wait(2500);
        await onComplete();
        setTimeout(() => {
            resetLogMessages();
        }, 500);
    }, [resetLogMessages, onComplete]);


    // initialize the ue4ss installation's configuration
    const setUe4ssDefaultSettings = React.useCallback(async () => {
        if (!requiredModulesLoaded) return;
        try {
            addLogMessage('Setting UE4SS Default Settings');

            const game_data = await window.palhub('validateGamePath', game.path);
            const {settings} = game_data.map_data.platforms[game.launch_type].modloader.ue4ss;
            if (Object.keys(settings).length === 0) {
                addLogMessage('No UE4SS settings found');
            } else {
                addLogMessage('Found UE4SS settings, applying defaults');
                const ini_path = game_data.ue4ss_settings;//await window.palhub('joinPath', game_data.ue4ss_root, 'UE4SS-settings.ini');
                let updated_ini = await window.palhub('readFile', ini_path, { encoding: 'utf-8' });
                for (const setting in settings) {
                    if (!Object.prototype.hasOwnProperty.call(settings, setting)) continue;
                    const [category, key] = setting.split('.');
                    updated_ini = replaceUe4ssIniKeyValue(updated_ini, category, key, settings[setting]);
                    addLogMessage(`Set ${setting} to ${settings[setting]}`);
                }
                //  do any other configuration initialization changes here.
                await window.palhub('writeFile', ini_path, updated_ini, { encoding: 'utf-8' });
                addLogMessage('Successfully updated UE4SS-Settings.ini');
            }
            onFinished();
        } catch (error) {
            console.error(error);
        }
    }, [game, onFinished]);

    React.useEffect(() => {
        if (!requiredModulesLoaded) return;

        const processData = async (type, data) => {
            switch (type) {
                case 'download': {
                    addLogMessage(`Downloading: ${data.filename} - ${data.percentage}%`);
                    break;
                }
                case 'extract': {
                    addLogMessage(`Extracting: ${data.outputPath}`);
                    break;
                }
                case 'delete': {
                    addLogMessage(`Deleting: ${data}`);
                    break;
                }
                case 'error': {
                    addLogMessage(data);
                    break;
                }
                case 'patching': {
                    addLogMessage(`Patching: ${data}`);
                    break;
                }
                case 'complete': {
                    addLogMessage('UE4SS Installation Complete!');
                    setUe4ssDefaultSettings();
                    break;
                }
                case 'uninstalled': {
                    addLogMessage('UE4SS Uninstallation Complete!');
                    onFinished();
                }
            }
        }

        const removeDataHandler = window.ipc.on('ue4ss-process', processData);
        return () => removeDataHandler();
    }, [onFinished]);

    // return <pre className="m-0 p-2 text-start">{logMessages.join('\n')}</pre>;

    return <pre className="m-0 p-3 radius0 text-start" ref={logRef} style={{ height }}>{logMessages.join('\n')}</pre>

    return <div className="m-0" ref={logRef}>
        <pre className="m-0 p-3 radius0 text-start" style={{ height }}>{logMessages.join('\n')}</pre>
    </div>;
}
