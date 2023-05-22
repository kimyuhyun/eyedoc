import axios from "axios";
import Layout from "../../components/Layout";
import Table from "../../components/Table";
import Card from "../../components/Card";
import Field from "../../components/Field";
import menu from "../../utils/menu";
import { useRecoilState } from "recoil";
import { paramsState, toastState, loadingState } from "../../utils/atom";
import { writer, listor } from "../../utils/store";
import { useEffect, useState } from "react";

const table = "GRADE_tbl";

export default () => {
    const [looading, setLoading] = useRecoilState(loadingState);
    const [toast, setToast] = useRecoilState(toastState);
    const [params, setParams] = useRecoilState(paramsState);

    const [data, setData] = useState([]);

    useEffect(() => {
        getData();
    }, [params.now]);

    const getData = async () => {
        setLoading(true);
        const url = "/admin/grade";
        const data = await listor(url);
        setData(data);
        setLoading(false);
    };

    console.log(data);

    if (!data) {
        return "error";
    }

    if (data.code == 0) {
        return data.msg;
    }

    const columns = [
        { textName: "번호", colName: "idx", isSort: false },
        { textName: "권한레벨", colName: "level1", isSort: false },
        { textName: "권한명", colName: "name1", isSort: false },
        { textName: "등록일", colName: "created", isSort: false },
        { textName: "수정일", colName: "modified", isSort: false },
    ];

    return (
        <Layout>
            <Card>
                <Table columns={columns} table={table}>
                    {data.map((row, i) => (
                        <tr key={i}>
                            <td className="text-center">
                                <input type="checkbox" name="idx" value={row.idx} />
                            </td>
                            <td className="text-center text-nowrap">{row.idx}</td>
                            <td className="text-center text-nowrap">{row.level1}</td>
                            <td className="text-nowrap">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-link"
                                    onClick={() => {
                                        setParams({
                                            ...params,
                                            idx: row.idx,
                                            modal: true,
                                            data: row,
                                        });
                                    }}
                                >
                                    {row.name1}
                                </button>
                            </td>
                            <td className="text-center text-nowrap">{row.created}</td>
                            <td className="text-center text-nowrap">{row.modified}</td>
                        </tr>
                    ))}
                </Table>
            </Card>

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
                                        delete frm.link;
                                        console.log(frm);

                                        var show_menu_link = "";
                                        if (e.target.link.length == undefined) {
                                            show_menu_link += "," + e.target.link.value;
                                        } else {
                                            for (const obj of e.target.link) {
                                                if (obj.checked) {
                                                    show_menu_link += "," + obj.value;
                                                }
                                            }
                                        }

                                        frm.show_menu_link = show_menu_link.substr(1);

                                        console.log(frm);

                                        const data2 = await writer(frm);

                                        setToast({
                                            isToast: true,
                                            message: frm.idx ? "수정 되었습니다." : "등록 되었습니다.",
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

                                    <Field title="권한레벨" name1="level1" type="text" readOnly={false} required={true} defaultValue={params.data ? params.data.level1 : ""} />
                                    <Field title="권한명" name1="name1" type="text" readOnly={false} required={true} defaultValue={params.data ? params.data.name1 : ""} />

                                    <table className="table table-borderless table-sm">
                                        <tbody>
                                            {menu.map((row, i) => (
                                                <tr key={i}>
                                                    <th valign="middle">{row.title}</th>
                                                    <td className="d-flex flex-row">
                                                        {row.child.map((row2, j) => (
                                                            <div key={j} className="form-check mb-0 ms-3">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    name="link"
                                                                    defaultChecked={params.data ? params.data.show_menu_link.includes(row2.link) : false}
                                                                    value={row2.link}
                                                                    id={`id${i}_${j}`}
                                                                />
                                                                <label className="form-check-label" htmlFor={`id${i}_${j}`}>
                                                                    {row2.title}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="d-flex justify-content-between">
                                        <div></div>
                                        <button type="submit" className="btn btn-primary btn-sm">
                                            등록
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
