import Layout from "../../components/Layout";
import Pager from "../../components/Pager";
import SearchForm from "../../components/SearchForm";
import Table from "../../components/Table";
import Field from "../../components/Field";
import ImageDropZone from "../../components/ImageDropZone";
import { useRecoilState } from "recoil";
import { paramsState, toastState, loadingState, fileObjectState } from "../../utils/atom";
import { useResetRecoilState } from "recoil";
import { writer, listor, uploader } from "../../utils/store";
import { useEffect, useState } from "react";

const table = "MEMB_tbl";

export default () => {
    const [looading, setLoading] = useRecoilState(loadingState);
    const [toast, setToast] = useRecoilState(toastState);

    const [fileObject, setFileObject] = useRecoilState(fileObjectState);
    const resetFileObject = useResetRecoilState(fileObjectState);

    const [params, setParams] = useRecoilState(paramsState);
    

    const [data, setData] = useState({});

    useEffect(() => {
        getData();
    }, [params.now]);

    const getData = async () => {
        setLoading(true);
        const url = `/admin/user?page=${params.page}&search_column=${params.search_column}&search_value=${params.search_value}&orderby=${params.orderby}`;
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
        { textName: "사진", colName: "filename0", isSort: false },
        { textName: "이름", colName: "name1", isSort: true },
        { textName: "아이디", colName: "id", isSort: true },
        { textName: "등록일", colName: "created", isSort: true },
        { textName: "수정일", colName: "modified", isSort: true },
    ];

    return (
        <Layout>
            <div className="card shadow mb-5">
                <div className="card-body table-responsive">
                    <SearchForm
                        columns={[
                            { value: "name1", text: "이름" },
                            { value: "id", text: "아이디" },
                        ]}
                    />
                    <Table columns={columns} table={table}>
                        {data.list.map((row, i) => (
                            <tr key={i}>
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
                                                idx: row.idx,
                                                modal: true,
                                                data: row,
                                            });
                                        }}
                                    >
                                        {row.name1}
                                    </button>
                                </td>
                                <td className="text-center text-nowrap">{row.id}</td>
                                <td className="text-center text-nowrap">{row.created}</td>
                                <td className="text-center text-nowrap">{row.modified}</td>
                            </tr>
                        ))}
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
                                        if (frm.pass1 == "") {
                                            delete frm.pass1;
                                        }
                                        const formData = new FormData();
                                        for (const key in fileObject) {
                                            const file = fileObject[key];
                                            if (file == "del") {
                                                console.log(key, file);
                                                eval(`frm.${key} = '';`);
                                            } else {
                                                formData.append(`${key}`, file);
                                            }
                                        }

                                        const data = await uploader(formData);
                                        resetFileObject(); // 파일 업로드 후 파일 객체를 초기화한다.

                                        try {
                                            for (const obj of data) {
                                                eval(`frm.${obj.key} = '${obj.value}';`);
                                            }
                                        } catch (error) {}
                                        console.log("frm", frm);

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
                                    <input name="level1" type="hidden" defaultValue={9} />

                                    <Field title="아이디" name1="id" type="text" readOnly={params.data && true} required={true} defaultValue={params.data ? params.data.name1 : ""} />
                                    <Field
                                        title="패스워드"
                                        name1="pass1"
                                        type="password"
                                        readOnly={false}
                                        required={params.data ? false : true}
                                        defaultValue={""}
                                        placeholder="변경시에만 입력하세요."
                                    />
                                    <Field title="이름" name1="name1" type="text" readOnly={false} required={true} defaultValue={params.data ? params.data.name1 : ""} />

                                    <ImageDropZone index={0} filename={params.data ? params.data.filename0 : ""} />

                                    <div className="d-flex justify-content-between">
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
