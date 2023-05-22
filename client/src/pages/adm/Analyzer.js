import axios from "axios";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { listor } from "../../utils/store";
import { useRecoilState } from "recoil";
import { loadingState } from "../../utils/atom";

export default () => {
    const [loading, setLoading] = useRecoilState(loadingState);
    const [options, setOptions] = useState({});
    const { gbn } = useParams();
    const [data, setData] = useState(null);

    useEffect(() => {
        getData();
    }, [gbn]);

    const getData = async () => {
        const url = `/admin/analyzer/${gbn}`;
        const data = await listor(url);

        if (gbn == "graph1") {
            setOptions({
                chart,
                yAxis,
                xAxis: {
                    categories: data.date,
                },
                title: {
                    text: "전체방문자",
                },
                series: [
                    { name: "총방문자", data: data.ttl },
                    { name: "재방문자", data: data.re },
                    { name: "신규방문자", data: data.new1 },
                ],
            });
        } else if (gbn == "graph2") {
            setOptions({
                chart,
                yAxis,
                xAxis: {
                    categories: data.date,
                },
                title: {
                    text: "트래픽수",
                },
                series: [{ name: "트래픽", data: data.traffic }],
            });
        } else if (gbn == "graph3") {
            setOptions({
                chart,
                yAxis,
                xAxis: {
                    categories: data.time,
                },
                title: {
                    text: "시간대별 트래픽수",
                },
                series: [
                    { name: "오늘", data: data.today },
                    { name: "어제", data: data.yesterday },
                    { name: "1주전", data: data.weekago },
                ],
            });
        }

        setLoading(false);
    };

    const chart = {
        type: "spline",
    };
    const yAxis = {
        labels: {
            formatter: function () {
                return this.value;
            },
        },
        allowDecimals: false,
        title: {
            text: "명",
        },
    };

    // if (!data) {
    //     return setLoading(true);
    // }

    return (
        <Layout>
            <div className="card shadow">
                <div className="card-body">
                    <HighchartsReact highcharts={Highcharts} options={options} />
                </div>
            </div>
        </Layout>
    );
};
