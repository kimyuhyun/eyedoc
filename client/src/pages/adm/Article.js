import { useRecoilState } from "recoil";
import { paramsState, loadingState } from "../../utils/atom";
import { listor } from "../../utils/store";
import Layout from "../../components/Layout";
import Pager from "../../components/Pager";
import SearchForm from "../../components/SearchForm";
import ArticleDetail from "./ArticleDetail";
import Table from "../../components/Table";
import { useEffect, useState } from "react";
import { getUser } from "../../utils/common";
import { useParams } from "react-router-dom";

const table = "BOARD_tbl";

export default () => {
    const { board_id } = useParams();
    const [params, setParams] = useRecoilState(paramsState);
    const [looading, setLoading] = useRecoilState(loadingState);
    const [data, setData] = useState({ list: [], page_helper: {} });

    useEffect(() => {
        setParams({ ...params, board_id, page: 1, now: Date.now() });
    }, [board_id]);

    useEffect(() => {
        if (params.board_id != "") {
            getData();
        }
    }, [params.now]);

    const getData = async () => {
        setLoading(true);
        const url = `/article/${params.board_id}?id=${getUser().id}&search_column=${params.search_column}&search_value=${params.search_value}&orderby=${params.orderby}&page=${params.page}`;
        const data = await listor(url);
        setData(data);
        setLoading(false);
    };

    console.log(data);

    if (!data) {
        return setLoading(true);
    }

    if (data.code == 0) {
        return (
            <div>
                {JSON.stringify(data)}
                <a href="/login">move login</a>
            </div>
        );
    }

    if (!data.list) {
        return "error";
    }

    const columns = [
        { textName: "번호", colName: "idx", isSort: true },
        { textName: "썸네일", colName: "filename0", isSort: false },
        { textName: "제목", colName: "title", isSort: true },
        { textName: "댓글수", colName: "reply_cnt", isSort: false },
        { textName: "조횟수", colName: "see", isSort: false },
        { textName: "좋아요수", colName: "like_cnt", isSort: false },
        { textName: "작성자", colName: "name1", isSort: false },
        { textName: "등록일", colName: "created", isSort: false },
        { textName: "수정일", colName: "modified", isSort: false },
    ];

    return (
        <Layout>
            <div className="card shadow mb-5">
                <div className="card-body table-responsive">
                    <SearchForm
                        columns={[
                            { value: "title", text: "제목" },
                            { value: "memo", text: "내용" },
                        ]}
                    />

                    <Table columns={columns} table={table}>
                        {data.list.map((row, i) => (
                            <tr key={row.idx}>
                                <td className="text-center">
                                    <input type="checkbox" name="idx" value={row.idx} />
                                </td>
                                <td className="text-center text-nowrap">{row.idx}</td>

                                <td className="text-center p-0">{row.filename0 && <img src={row.filename0} width={40} height={40} style={{ objectFit: "cover" }} />}</td>
                                <td className="text-nowrap">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-link"
                                        onClick={() => {
                                            setParams({
                                                ...params,
                                                table,
                                                modal: true,
                                                idx: row.idx,
                                            });
                                        }}
                                    >
                                        {row.title}
                                    </button>
                                </td>

                                <td className="text-center text-nowrap">{row.reply_cnt}</td>
                                <td className="text-center text-nowrap">{row.see_cnt}</td>
                                <td className="text-center text-nowrap">{row.like_cnt}</td>
                                <td className="text-center text-nowrap">{row.name1}</td>
                                <td className="text-center text-nowrap">{row.created}</td>
                                <td className="text-center text-nowrap">{row.modified}</td>
                            </tr>
                        ))}
                        {data.page_helper.pnTotal == 0 && (
                            <tr>
                                <td colSpan="20" align="center" height="100">
                                    검색된 결과가 없습니다.
                                </td>
                            </tr>
                        )}
                    </Table>
                </div>
            </div>

            <Pager pageHelper={data.page_helper} />
            {params.modal && <ArticleDetail />}
        </Layout>
    );
};
