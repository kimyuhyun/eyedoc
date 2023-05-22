import Layout from "../../components/Layout";
import { listor } from "../../utils/store";
import { useEffect, useState } from "react";

export default () => {
    const [data, setData] = useState({ list: [] });

    useEffect(() => {
        console.log("useEffect");
        getData();
    }, []);

    const getData = async () => {
        const url = `/admin/liveuser`;
        const data = await listor(url);
        setData(data);
    };

    console.log(data);

    if (!data) {
        return "error";
    }

    if (data.code == 0) {
        return data.msg;
    }

    return (
        <Layout>
            <div className="card shadow mb-4">
                <div className="card-body">
                    <div>
                        {data.currentTime}
                        <b className="text-danger ms-2">{data.list.length}</b> 명 접속 (4분동안 액션이 없으면 카운팅에서 제외 됩니다.)
                    </div>
                    <hr />

                    {data.list.map((row, i) => (
                        <div key={i}>
                            {i + 1}. {row.url} | {row.id} | {row.date}
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};
