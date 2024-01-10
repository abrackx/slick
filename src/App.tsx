import type {LoaderFunctionArgs} from "react-router-dom";
import {
    Form,
    Link,
    Outlet,
    RouterProvider,
    createBrowserRouter,
    redirect,
    useActionData,
    useFetcher,
    useLocation,
    useNavigation,
    useRouteLoaderData,
} from "react-router-dom";
import {obsProvider} from "./auth";
import OBSWebSocket from "obs-websocket-js";

const router = createBrowserRouter([
    {
        id: "root",
        path: "/",
        loader() {
            // Our root route always provides the user, if logged in
            return {connection: obsProvider.connection};
        },
        Component: Layout,
        children: [
            {
                index: true,
                Component: PublicPage,
            },
            {
                path: "login",
                action: loginAction,
                loader: loginLoader,
                Component: LoginPage,
            },
            {
                path: "protected",
                loader: protectedLoader,
                Component: ProtectedPage,
            },
        ],
    },
    {
        path: "/logout",
        async action() {
            // We signout in a "resource route" that we can hit from a fetcher.Form
            await obsProvider.signout();
            return redirect("/");
        },
    },
]);

export default function App() {
    return (
        <RouterProvider router={router} fallbackElement={<p>Initial Load...</p>}/>
    );
}

function Layout() {
    return (
        <div>
            <AuthStatus/>
            <ul>
                <li>
                    <Link to="/">Public Page</Link>
                </li>
                <li>
                    <Link to="/protected">Protected Page</Link>
                </li>
            </ul>
            <Outlet/>
        </div>
    );
}

function AuthStatus() {
    // Get our logged in user, if they exist, from the root route loader data
    let {connection} = useRouteLoaderData("root") as { connection: OBSWebSocket | null };
    let fetcher = useFetcher();

    if (!connection) {
        return <p>You are not logged in.</p>;
    }

    let isLoggingOut = fetcher.formData != null;

    return (
        <div>
            <p>Welcome, you are using version: {obsProvider.version}!</p>
            <fetcher.Form method="post" action="/logout">
                <button type="submit" disabled={isLoggingOut}>
                    {isLoggingOut ? "Signing out..." : "Sign out"}
                </button>
            </fetcher.Form>
        </div>
    );
}

async function loginAction({request}: LoaderFunctionArgs) {
    let formData = await request.formData();
    let url = formData.get("url") as string | null;
    let password = formData.get("password") as string | null;

    // Validate our form inputs and return validation errors via useActionData()
    if (!url || !password) {
        return {
            error: "You must provide a url/password to log in",
        };
    }

    // Sign in and redirect to the proper destination if successful.
    try {
        await obsProvider.signin(url, password);
    } catch (error) {
        // Unused as of now but this is how you would handle invalid
        // username/password combinations - just like validating the inputs
        // above
        return {
            error: "Invalid login attempt",
        };
    }

    let redirectTo = formData.get("redirectTo") as string | null;
    return redirect(redirectTo || "/");
}

async function loginLoader() {
    if (obsProvider.isConnected) {
        return redirect("/");
    }
    return null;
}

function LoginPage() {
    let location = useLocation();
    let params = new URLSearchParams(location.search);
    let from = params.get("from") || "/";

    let navigation = useNavigation();
    let isLoggingIn = navigation.formData?.get("username") != null;

    let actionData = useActionData() as { error: string } | undefined;

    return (
        <div>
            <p>You must log in to view the page at {from}</p>

            <Form method="post" replace>
                <input type="hidden" name="redirectTo" value={from}/>
                <label>
                    Url: <input name="url"/>
                </label>{" "}
                <label>
                    Password: <input type="password" name="password"/>
                </label>{" "}
                <button type="submit" disabled={isLoggingIn}>
                    {isLoggingIn ? "Logging in..." : "Login"}
                </button>
                {actionData && actionData.error ? (
                    <p style={{color: "red"}}>{actionData.error}</p>
                ) : null}
            </Form>
        </div>
    );
}

function PublicPage() {
    return <h3>Public</h3>;
}

function protectedLoader({request}: LoaderFunctionArgs) {
    // If the user is not logged in and tries to access `/protected`, we redirect
    // them to `/login` with a `from` parameter that allows login to redirect back
    // to this page upon successful authentication
    if (!obsProvider.isConnected) {
        let params = new URLSearchParams();
        params.set("from", new URL(request.url).pathname);
        return redirect("/login?" + params.toString());
    }
    return null;
}

function ProtectedPage() {
    return <h3>Protected</h3>;
}