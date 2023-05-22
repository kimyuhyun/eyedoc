import React from "react";
import axios from "axios";
import { useRecoilState } from "recoil";
import { loadingState } from "../../utils/atom";
import { useParams, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { tokenIssue } from "../../utils/store";

const loadPicoCSS = () => {
    const pico = document.createElement("link");
    pico.rel = "stylesheet";
    pico.href = "https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css";
    document.head.appendChild(pico);
    document.querySelector("html").setAttribute("data-theme", "light");
};

export default () => {
    const [looading, setLoading] = useRecoilState(loadingState);

    const { board_id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = searchParams.get("page") ?? "1";
    const search_column = searchParams.get("search_column") ?? "";
    const search_value = searchParams.get("search_value") ?? "";
    const orderby = searchParams.get("orderby") ?? "";

    const [data, setData] = useState({});

    useEffect(() => {
        console.log("useEffect");
        getData();
    }, []);

    const getData = async () => {
        setLoading(true);
        const token = await tokenIssue();
        const url = `/article/${board_id}?search_column=${search_column}&search_value=${search_value}&orderby=${orderby}&page=${page}`;
        const { data } = await axios({
            url,
            method: "GET",
            headers: { token },
        });
        setData(data);
        setLoading(false);
    };

    if (!data) {
        return "error";
    }

    if (data.code == 0) {
        return data.msg;
    }

    loadPicoCSS();

    return <Layout>{JSON.stringify(data)}</Layout>;
};
