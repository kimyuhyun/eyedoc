import { useRecoilState } from "recoil";
import { paramsState, loadingState, toastState } from "../../utils/atom";
import { writer, reader, listor } from "../../utils/store";

import Layout from "../../components/Layout";
import Pager from "../../components/Pager";
import SearchForm from "../../components/SearchForm";
import Table from "../../components/Table";
import Field from "../../components/Field";
import { useEffect, useState } from "react";
import { getUser } from "../../utils/common";

const table = "BOARD_tbl";
const board_id = "cscenter";

export default () => {
    const [looading, setLoading] = useRecoilState(loadingState);
    const [toast, setToast] = useRecoilState(toastState);
    const [params, setParams] = useRecoilState(paramsState);
    const [data, setData] = useState({ list: [], page_helper: {} });

    useEffect(() => {
        getList();
    }, [params.now]);

    const getList = async () => {
        setLoading(true);
        const url = `/article/${board_id}?search_column=${params.search_column}&search_value=${params.search_value}&orderby=${params.orderby}&page=${params.page}`;
        const data = await listor(url);
        setData(data);
        setLoading(false);

        setParams({
            ...params,
            board_id,
        });

        console.log(params);
    };

    const getDetail = async (idx) => {
        setLoading(true);
        const data = await reader({ idx, table });
        console.log(data);
        setParams({
            ...params,
            data,
            modal: true,
        });
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
        { textName: "내용", colName: "memo", isSort: false },
        { textName: "답변YN", colName: "comment", isSort: true },
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
                            { value: "memo", text: "내용" },
                            { value: "name1", text: "작성자" },
                        ]}
                    />
                    <Table columns={columns} table={table}>
                        {data.list.map((row, i) => (
                            <tr key={row.idx}>
                                <td className="text-center">
                                    <input type="checkbox" name="idx" value={row.idx} />
                                </td>
                                <td className="text-center text-nowrap">{row.idx}</td>

                                <td className="text-nowrap">
                                    <button
                                        type="button"
                                        style={{ maxWidth: "350px" }}
                                        className="btn btn-sm btn-link  text-truncate"
                                        onClick={() => {
                                            getDetail(row.idx);
                                        }}
                                    >
                                        {row.memo}
                                    </button>
                                </td>

                                <td className="text-center text-nowrap">{row.comment == "" ? "N" : "Y"}</td>

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
            {params.modal && (
                <div className="modal bg-dark bg-opacity-50" style={{ display: "block" }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setParams({
                                            ...params,
                                            modal: false,
                                            idx: "",
                                            data: null,
                                        });
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body p-0">
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        //유용한놈!
                                        const frm = Object.fromEntries(new FormData(e.target).entries());
                                        if (frm.idx == "") {
                                            delete frm.idx;
                                        }
                                        await writer(frm);

                                        setToast({
                                            isToast: true,
                                            message: "답변 등록 되었습니다.",
                                        });

                                        setParams({
                                            ...params,
                                            modal: false,
                                            idx: "",
                                            data: null,
                                            now: Date.now(),
                                        });
                                    }}
                                    className="p-3"
                                >
                                    <input name="idx" type="hidden" defaultValue={params.data ? params.data.idx : ""} />
                                    <input name="table" type="hidden" defaultValue={table} />
                                    <input name="board_id" type="hidden" defaultValue={board_id} />

                                    <input name="id" type="hidden" defaultValue={params.data ? params.data.id : getUser().id} />
                                                                        
                                    <Field title="질문" name1="memo" type="textarea" readOnly={true} required={true} defaultValue={params.data ? params.data.memo : ""} />

                                    <Field title="답변" name1="comment" type="textarea" readOnly={false} required={false} defaultValue={params.data ? params.data.comment : ""} />

                                    <div className="d-flex justify-content-between mt-4">
                                        <div></div>
                                        <button type="submit" className="btn btn-primary btn-sm">
                                            저장
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};
