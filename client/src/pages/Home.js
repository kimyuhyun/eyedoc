import axios from "axios";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { loadingState } from "../utils/atom";
import { tokenIssue } from "../utils/store";

export default () => {
    const [looading, setLoading] = useRecoilState(loadingState);
    const [data, setData] = useState({});
    useEffect(() => {
        getInfo();
    }, []);

    const getInfo = async () => {
        setLoading(true);
        const token = await tokenIssue();
        const url = `/api`;
        const { data } = await axios({
            url,
            method: "GET",
            headers: { token },
        });
        setData(data);
        setLoading(false);
    };

    if (!data) {
        return "no data2";
    }

    if (data.code == 0) {
        return "Q" + data.msg;
    }

    return (
        <div style={{ height: "100vh" }} className="p-4">
            <div>{data.title}</div>
            <div>MODE: {data.mode}</div>
            <div>{JSON.stringify(data.session)}</div>
            <button className="btn btn-primary" onClick={getInfo}>
                mutate
            </button>
        </div>
    );
};
