import React, { useEffect, useRef } from 'react'
import toast from "react-hot-toast";
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const titles = {
    login: "Login",
    register: "Sign Up",
    forgot: "Forgot Password",
    reset: "Reset Password",
};

const Login = () => {
    const { setShowUserLogin, setUser, navigate, axios } = useAppContext();
    const location = useLocation();
    const googleButtonRef = useRef(null);
    const [state, setState] = React.useState(location.pathname === "/reset-password" ? "reset" : "login");
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const query = new URLSearchParams(location.search);
    const token = query.get("token");
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    useEffect(() => {
        const verifyEmail = async () => {
            if (location.pathname !== "/verify-email" || !token) return;

            const { data } = await axios.post('/api/user/verify-email', { token });
            if (data.success) {
                toast.success(data.message);
                setUser(data.user);
                setShowUserLogin(false);
                navigate('/');
            } else {
                toast.error(data.message);
            }
        };

        verifyEmail();
    }, [location.pathname, token]);

    useEffect(() => {
        if (!googleClientId || !googleButtonRef.current || state !== "login") return;

        const renderGoogleButton = () => {
            if (!window.google?.accounts?.id || !googleButtonRef.current) return;

            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: async ({ credential }) => {
                    try {
                        const { data } = await axios.post('/api/user/google', { credential });
                        if (data.success) {
                            toast.success(data.message);
                            setUser(data.user);
                            setShowUserLogin(false);
                            navigate('/');
                        } else {
                            toast.error(data.message);
                        }
                    } catch (error) {
                        toast.error(error.message);
                    }
                },
            });
            window.google.accounts.id.renderButton(googleButtonRef.current, {
                theme: "outline",
                size: "large",
                width: googleButtonRef.current.offsetWidth,
            });
        };

        if (window.google?.accounts?.id) {
            renderGoogleButton();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = renderGoogleButton;
        document.body.appendChild(script);
    }, [googleClientId, state]);

    const onSubmitHandle = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            let payload = { email, password };
            let endpoint = state;

            if (state === "register") payload = { name, email, password };
            if (state === "forgot") payload = { email };
            if (state === "reset") payload = { token, password };

            const { data } = await axios.post(`/api/user/${endpoint === "reset" ? "reset-password" : endpoint === "forgot" ? "forgot-password" : endpoint}`, payload);

            if (data.success) {
                toast.success(data.message);

                if (state === "login" || state === "register") {
                    setUser(data.user);
                    setShowUserLogin(false);
                    navigate('/');
                }

                if (state === "forgot") setState("login");
                if (state === "reset") {
                    setState("login");
                    navigate('/');
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    const closeModal = () => {
        setShowUserLogin(false);
        if (location.pathname === "/verify-email" || location.pathname === "/reset-password") {
            navigate('/');
        }
    };

    return (
        <div onClick={closeModal} className='fixed inset-0 z-30 flex items-center text-sm text-gray-600 bg-black/50 px-4'>
            <form onSubmit={onSubmitHandle} onClick={(e) => e.stopPropagation()} className="flex flex-col gap-4 m-auto items-start p-8 py-10 w-full max-w-[352px] rounded-lg shadow-xl border border-gray-200 bg-white">
                <p className="text-2xl font-medium m-auto">
                    <span className="text-primary">User</span> {titles[state]}
                </p>

                {state === "register" && (
                    <div className="w-full">
                        <p>Name</p>
                        <input onChange={(e) => setName(e.target.value)} value={name} placeholder="type here" className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary" type="text" required />
                    </div>
                )}

                {(state === "login" || state === "register" || state === "forgot") && (
                    <div className="w-full">
                        <p>Email</p>
                        <input onChange={(e) => setEmail(e.target.value)} value={email} placeholder="type here" className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary" type="email" required />
                    </div>
                )}

                {state !== "forgot" && (
                    <div className="w-full">
                        <p>{state === "reset" ? "New Password" : "Password"}</p>
                        <input onChange={(e) => setPassword(e.target.value)} value={password} placeholder="type here" className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary" type="password" minLength={6} required />
                    </div>
                )}

                {state === "register" && (
                    <p>
                        Already have account? <span onClick={() => setState("login")} className="text-primary cursor-pointer">click here</span>
                    </p>
                )}

                {state === "login" && (
                    <div className="w-full flex items-center justify-between gap-3">
                        <p>Create account? <span onClick={() => setState("register")} className="text-primary cursor-pointer">click here</span></p>
                        <button type="button" onClick={() => setState("forgot")} className="text-primary cursor-pointer whitespace-nowrap">Forgot?</button>
                    </div>
                )}

                {(state === "forgot" || state === "reset") && (
                    <p>
                        Back to login? <span onClick={() => setState("login")} className="text-primary cursor-pointer">click here</span>
                    </p>
                )}

                <button disabled={loading} className="bg-primary hover:bg-primary-dull disabled:opacity-70 transition-all text-white w-full py-2 rounded-md cursor-pointer">
                    {loading ? "Please wait..." : state === "register" ? "Create Account" : state === "forgot" ? "Send Reset Link" : state === "reset" ? "Update Password" : "Login"}
                </button>

                {state === "login" && googleClientId && (
                    <>
                        <div className="w-full flex items-center gap-3 text-gray-400">
                            <span className="h-px flex-1 bg-gray-200"></span>
                            <span>or</span>
                            <span className="h-px flex-1 bg-gray-200"></span>
                        </div>
                        <div ref={googleButtonRef} className="w-full min-h-10"></div>
                    </>
                )}
            </form>
        </div>
    )
}

export default Login
