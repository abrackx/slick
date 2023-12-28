import React, {ChangeEvent, useEffect, useState} from "react"
import OBSWebSocket from "obs-websocket-js";
import setupObsWebSocket from "./obs.tsx";

type ObsContextType = {
    url?: string,
    obs?: OBSWebSocket,
}

const defaultObsContext = {
    data: {
        url: 'Your OBS websocket URL...',
    } as ObsContextType,
    setData: (_state: ObsContextType) => {
    }
};

const ObsContext = React.createContext(defaultObsContext);

const LoginForm = () => {
    const {data, setData} = React.useContext(ObsContext);
    const {url} = data
    useEffect(() => {
        const callIt = async (url: string) => {
            return await setupObsWebSocket(url, password.value);
        }
        if (url && url !== defaultObsContext.data.url) {
            const obs = callIt(url);
            obs.then(connection => {
                if (connection) {
                    setData({obs: connection, ...data})
                }
            })
        }
    }, [url])


    const [visibleUrl, setVisibleUrl] = useState({value: url});
    const [password, setPassword] = useState({value: ""});

    if (data.obs !== undefined) {
        return <></>
    }
    return (
        <div>
            <div>
                <input onChange={(event: ChangeEvent<{ value: string }>) => {
                    setVisibleUrl({value: event?.currentTarget?.value});
                }} value={visibleUrl.value}/>
                <input onChange={(event: ChangeEvent<{ value: string }>) => {
                    setPassword({value: event?.currentTarget?.value});
                }} value={password.value} type="password"/>
            </div>
            <button onClick={() => {
                setData({url: visibleUrl?.value})
            }}>
                Log in!
            </button>
        </div>
    )
}

const Main = () => {
    const {data} = React.useContext(ObsContext);
    const [version, setVersion] = useState("")
    const obs = data.obs;
    useEffect(() => {
        const callIt = async () => {
            return obs?.call("GetVersion");
        }
        callIt().then(maybeVersion => {
            if (maybeVersion) {
                setVersion(maybeVersion.obsVersion)
            }
        })
    }, [data.obs]);
    if (!data.obs) {
        return <></>
    }
    return (
        <div>
            We did it! Connected to OBS Version: {version}
        </div>
    )
}

export default function App() {
    const [data, setData] = React.useState(defaultObsContext.data)
    const changeValues = (value: ObsContextType) => setData(data && value);

    return (
        <ObsContext.Provider value={{data, setData: changeValues}}>
            <LoginForm/>
            <Main/>
        </ObsContext.Provider>
    )
}