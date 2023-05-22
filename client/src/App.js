import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.js";
import "./css/bootstrap.icons.css";
import "./css/admin.css";

import { loadingState, toastState } from "./utils/atom";
import { useRecoilState } from "recoil";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Login from "./pages/Login";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Main from "./pages/adm/Main";
import Grade from "./pages/adm/Grade";
import Article from "./pages/adm/Article";
import Manager from "./pages/adm/Manager";
import User from "./pages/adm/User";
import Analyzer from "./pages/adm/Analyzer";
import Dev from "./pages/adm/Dev";
import LiveUser from "./pages/adm/LiveUser";
import Loading from "./components/Loading";
import Toast from "./components/Toast";

import { getUser } from "./utils/common";
import Codes from "./pages/adm/Codes";
import Mypage from "./pages/adm/Mypage";
import Cscenter from "./pages/adm/Cscenter";

console.log(process.env.NODE_ENV);

if (process.env.NODE_ENV === "production") {
    console.log = function no_console() {};
    console.warn = function no_console() {};
}

const App = () => {
    const [loading, setLoading] = useRecoilState(loadingState);
    const [toast, setToast] = useRecoilState(toastState);

    const user = getUser();

    if (user) {
        return (
            <>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Home />}></Route>
                        {/* <Route path="*" element={<NotFound />}></Route> */}
                        <Route path="/login" element={<Login />}></Route>

                        <Route path="/adm" element={<Main />}></Route>
                        <Route path="/adm/mypage" element={<Mypage />}></Route>
                        <Route path="/adm/codes" element={<Codes />}></Route>
                        <Route path="/adm/dev/:board_id" element={<Dev />}></Route>
                        <Route path="/adm/grade" element={<Grade />}></Route>
                        <Route path="/adm/manager" element={<Manager />}></Route>
                        <Route path="/adm/user" element={<User />}></Route>

                        <Route path="/adm/article/:board_id" element={<Article />}></Route>
                        
                        <Route path="/adm/article/cscenter" element={<Cscenter page={1} />}></Route>

                        <Route path="/adm/analyzer/:gbn" element={<Analyzer />}></Route>
                        <Route path="/adm/liveuser" element={<LiveUser />}></Route>
                    </Routes>
                </BrowserRouter>
                {loading && <Loading />}
                {toast.isToast && <Toast />}
            </>
        );
    } else {
        return (
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />}></Route>
                    <Route path="/login" element={<Login />}></Route>
                    <Route path="*" element={<NotFound />}></Route>
                </Routes>
            </BrowserRouter>
        );
    }
};

export default App;
