import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { toastState } from "../utils/atom";
import { useEffect, useState } from "react";
import axios from "axios";
import menu from "../utils/menu";
import { getUser, removeUserSession } from "../utils/common";

export default ({ children }) => {
    const [name1, setName1] = useState("");
    const [filename0, setFilename0] = useState("");
    const [current_menu, setMenu] = useState({ m1: -1, m1_title: "", m2: -1, m2_title: "" });
    const location = useLocation();

    useEffect(() => {
        //메뉴를 루프 돌려서 현재 m1, m2 값을 찾아낸다!
        menu.map((item1, i) => {
            item1.child.map((item2, j) => {
                if (item2.link.trim().split("?")[0] == location.pathname.trim()) {
                    setMenu({ m1: i, m1_title: item1.title, m2: j, m2_title: item2.title });
                    return;
                }
            });
        });

        if (getUser()) {
            setName1(getUser().name1 ?? "");
        }
    }, [location]);

    function showAndHideLeftMenu() {
        console.log("showAndHideLeftMenu", window.innerWidth);
        document.querySelector("body").classList.toggle("toggle-sidebar");
    }

    const logout = async () => {
        const url = `/admin/logout`;
        console.log(url);
        const { data } = await axios({
            url,
            method: "GET",
        });
        if (data.code == 1) {
            removeUserSession();
            window.location.href = "/login";
        }
    };

    return (
        <div className="d-flex flex-column" style={{ height: "100vh" }}>
            <header id="header" className="header fixed-top d-flex align-items-center">
                <div className="d-flex align-items-center justify-content-between">
                    <i className="bi bi-list toggle-sidebar-btn ps-0" onClick={showAndHideLeftMenu}></i>
                    <Link to="/adm" className="logo d-flex align-items-center ms-3">
                        <span>EYEDOC</span>
                    </Link>
                </div>

                <nav className="header-nav ms-auto">
                    <ul className="d-flex align-items-center">
                        <li className="nav-item dropdown pe-3">
                            <a className="nav-link nav-profile d-flex align-items-center pe-0" href="#" data-bs-toggle="dropdown">
                                {filename0 && <img src={`/uploads/${filename0}`} width={36} height={36} alt="Profile" className="rounded-circle" />}
                                <span className="dropdown-toggle ps-2">{name1}</span>
                            </a>

                            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile pt-0">
                                <li>
                                    <Link className="dropdown-item d-flex align-items-center" to="/adm/mypage">
                                        <i className="bi bi-person"></i>
                                        <span>나의프로필</span>
                                    </Link>
                                </li>
                                <li>
                                    <hr className="dropdown-divider" />
                                </li>
                                <li>
                                    <a className="dropdown-item d-flex align-items-center" href="#" onClick={logout}>
                                        <i className="bi bi-box-arrow-right"></i>
                                        <span>로그아웃</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </nav>
            </header>

            <aside id="sidebar" className="sidebar">
                <ul className="sidebar-nav" id="sidebar-nav">
                    {menu.map((row, i) => (
                        <li key={i} className="nav-item">
                            <a className={`nav-link ${current_menu.m1 === i ? "" : "collapsed"}`} data-bs-target={`#menu-${i}`} data-bs-toggle="collapse" href="#">
                                <i className={`bi ${row.icon}`}></i>
                                <span>{row.title}</span>
                                <i className="bi bi-chevron-down ms-auto"></i>
                            </a>

                            <ul id={`menu-${i}`} className={`nav-content ${current_menu.m1 === i ? "" : "collapse"}`} data-bs-parent="#sidebar-nav">
                                {row.child.map((row2, j) => (
                                    <li key={j}>
                                        <Link
                                            to={`${row2.link}`}
                                            onClick={() => {
                                                if (window.innerWidth < 1199) {
                                                    showAndHideLeftMenu();
                                                }
                                            }}
                                        >
                                            <i className="bi bi-circle"></i>
                                            <span className={current_menu.m1 === i && current_menu.m2 === j ? "text-primary" : ""}>{row2.title}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            </aside>

            <main id="main" className="main flex-fill">
                {current_menu.m1_title && (
                    <div className="pagetitle">
                        <h1>{current_menu.m2_title}</h1>
                        <nav>
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item">
                                    <Link to="/adm">Home</Link>
                                </li>
                                <li className={`breadcrumb-item ${current_menu.m1 == null ? "d-none" : ""}`}>{current_menu.m1_title}</li>
                                <li className="breadcrumb-item active">{current_menu.m2_title}</li>
                            </ol>
                        </nav>
                    </div>
                )}
                {children}
            </main>

            <footer id="footer" className="footer">
                <div className="copyright">
                    &copy; Copyright <strong>{/* <span>Hongslab</span> */}</strong>. All Rights Reserved
                </div>
                {/* <div className="credits">
                    Designed by <a href="https://bootstrapmade.com/">BootstrapMade</a>
                </div> */}
            </footer>

            <a href="#" className="back-to-top d-flex align-items-center justify-content-center active">
                <i className="bi bi-arrow-up-short"></i>
            </a>
        </div>
    );
};
