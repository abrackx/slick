import {createContext, useContext, useEffect, useState} from "react"
import OBSWebSocket from "obs-websocket-js";
import setupObsWebSocket from "./obs.tsx";
import {createHashRouter, RouterProvider, useNavigate} from "react-router-dom";

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

const ObsContext = createContext(defaultObsContext);

const LoginForm = () => {
    const {setData} = useContext(ObsContext);
    const navigate = useNavigate();
    const [form, setForm] = useState({
        url: '',
        password: '',
    });

    const handleChange = (event: { target: { id: any; value: any; }; }) => {
        setForm({
            ...form,
            [event.target.id]: event.target.value,
        });
    };

    const handleSubmit = async (event: { preventDefault: () => void; }) => {
        event.preventDefault();
        if (form.url && form.url !== defaultObsContext.data.url) {
            const obs = setupObsWebSocket(form.url, form.password);
            obs.then(connection => {
                if (connection) {
                    setData({obs: connection, url: form.url})
                    navigate('/home', {replace: true})
                }
            })
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="url">url</label>
                <input
                    id="url"
                    type="text"
                    value={form.url}
                    onChange={handleChange}
                />
            </div>
            <div>
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                />
            </div>
            <button type="submit">Submit</button>
        </form>
    );
}

const Main = () => {
    const {data} = useContext(ObsContext);
    const [version, setVersion] = useState("")
    const obs = data.obs;
    useEffect(() => {
        (async () => {
            try {
                const d = await obs?.call("GetVersion")
                setVersion(d?.obsVersion || "")
            } catch (e) {
                console.error(e)
            }
        })();
    }, [data.obs]);
    return (
        <div>
            We did it! Connected to OBS Version: {version}
        </div>
    )
}

const router = createHashRouter([
    {
        path: "/",
        element: <LoginForm/>,
    },
    {
        path: "/home",
        element: <Main/>,
    },
]);

export default function App() {
    const [data, setData] = useState(defaultObsContext.data)
    const changeValues = (value: ObsContextType) => setData(data && value);

    return (
        <ObsContext.Provider value={{data, setData: changeValues}}>
            <RouterProvider router={router}/>
        </ObsContext.Provider>
    )
}