import React from "react";
import { useEffect, useRef } from "react";
import axios from "axios";
import { setUserSession, getSave } from "../utils/common";

const Login = () => {
    const inputId = useRef();
    const inputPw = useRef();
    const inputRemember = useRef();

    useEffect(() => {
        loadPicoCSS();
        inputId.current.focus();
        const save = getSave() ?? {};
        inputId.current.value = save.id || "";
        inputPw.current.value = save.pw || "";
        inputRemember.current.checked = save.id ? true : false;
    }, []);

    const loadPicoCSS = () => {
        const pico = document.createElement("link");
        pico.rel = "stylesheet";
        pico.href = "https://unpkg.com/@picocss/pico@1.*/css/pico.min.css";
        document.head.appendChild(pico);
        document.querySelector("html").setAttribute("data-theme", "light");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        //유용한놈!
        const frm = Object.fromEntries(new FormData(e.target).entries());

        const { data } = await axios({
            url: `/admin/login`,
            method: "POST",
            data: frm,
        });
        console.log(data);
        if (data.code === 1) {
            try {
                setUserSession(data.save, data.user);
                window.location.href = "/adm";
            } catch (error) {
                console.log(error);
            }
        } else {
            alert(data.msg);
        }
    };

    return (
        <>
            <main className="container">
                <article className="grid">
                    <div>
                        <hgroup>
                            <h1>로그인</h1>
                            <h2>A minimalist layout for Login pages</h2>
                        </hgroup>
                        <form onSubmit={(e) => handleSubmit(e)}>
                            <input ref={inputId} type="text" placeholder="ID" name="id" required />
                            <input ref={inputPw} type="password" placeholder="PW" autoComplete="current-password" name="pw" required />
                            <fieldset>
                                <label htmlFor="remember">
                                    <input ref={inputRemember} type="checkbox" role="switch" name="remember" />
                                    Remember me
                                </label>
                            </fieldset>
                            <button type="submit" className="contrast">
                                Login
                            </button>
                        </form>
                    </div>
                    <div></div>
                </article>
            </main>

            <style jsx="true">{`
                /* Grid */
                #root > main {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    min-height: calc(100vh);
                    padding: 1rem 0;
                }

                article {
                    padding: 0;
                    overflow: hidden;
                }

                article div {
                    padding: 1rem;
                }

                @media (min-width: 576px) {
                    body > main {
                        padding: 1.25rem 0;
                    }

                    article div {
                        padding: 1.25rem;
                    }
                }

                @media (min-width: 768px) {
                    body > main {
                        padding: 1.5rem 0;
                    }

                    article div {
                        padding: 1.5rem;
                    }
                }

                @media (min-width: 992px) {
                    body > main {
                        padding: 1.75rem 0;
                    }

                    article div {
                        padding: 1.75rem;
                    }
                }

                @media (min-width: 1200px) {
                    body > main {
                        padding: 2rem 0;
                    }

                    article div {
                        padding: 2rem;
                    }
                }

                /* Nav */
                summary[role="link"].secondary:is([aria-current], :hover, :active, :focus) {
                    background-color: transparent;
                    color: var(--secondary-hover);
                }

                /* Hero Image */
                article div:nth-of-type(2) {
                    display: none;
                    background-color: #374956;
                    background-image: url("https://picocss.com/examples/sign-in/assets/alessio-soggetti-8jeWeKdygfk-unsplash-1000x1200.jpg");
                    background-position: center;
                    background-size: cover;
                }

                @media (min-width: 992px) {
                    .grid > div:nth-of-type(2) {
                        display: block;
                    }
                }
            `}</style>
        </>
    );
};

export default Login;
