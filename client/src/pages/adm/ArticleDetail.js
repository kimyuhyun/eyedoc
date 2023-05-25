import axios from "axios";
import { getUser } from "../../utils/common";
import ImageDropZone from "../../components/ImageDropZone";
import Field from "../../components/Field";
import Reply from "../../components/Reply";
import { fileObjectState, paramsState, toastState, loadingState, replyArrayState, replyParamsState } from "../../utils/atom";
import { useRecoilState, useResetRecoilState } from "recoil";
import { reader, uploader } from "../../utils/store";
import { useEffect, useState } from "react";
import { writer } from "../../utils/store";

export default () => {
    const [loading, setLoading] = useRecoilState(loadingState);
    const [toast, setToast] = useRecoilState(toastState);

    const [fileObject, setFileObject] = useRecoilState(fileObjectState);
    const resetFileObject = useResetRecoilState(fileObjectState);

    const resetReplyParams = useResetRecoilState(replyParamsState);
    const resetReplyArray = useResetRecoilState(replyArrayState);

    const [params, setParams] = useRecoilState(paramsState);

    const [data, setData] = useState({});

    useEffect(() => {
        console.log("useEffect: ", params);
        getData();
    }, [params.idx]);

    const getData = async () => {
        setLoading(true);
        const data = await reader({ table: params.table, idx: params.idx });
        setData(data);
        setLoading(false);
    };

    console.log(data);

    if (!data) {
        return setLoading(true);
    }

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        //유용한놈!
        const frm = Object.fromEntries(new FormData(e.target).entries());

        if (frm.idx == "") {
            delete frm.idx;
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
        console.log(data);
        resetFileObject(); // 파일 업로드 후 파일 객체를 초기화한다.

        try {
            for (const obj of data) {
                eval(`frm.${obj.key} = '${obj.value}';`);
            }
        } catch (error) {}
        console.log("frm", frm);
        const data2 = await writer(frm);
        setParams({
            ...params,
            modal: false,
            idx: "",
            now: Date.now(),
        });

        setToast({
            isToast: true,
            message: frm.idx ? "수정 되었습니다." : "등록 되었습니다.",
        });

        setLoading(false);
    };

    return (
        <div className="modal bg-dark bg-opacity-50" style={{ display: "block" }}>
            <div className="modal-dialog modal-lg modal-fullscreen-lg-down modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => {
                                console.log(params);
                                //모달 닫기
                                setParams({
                                    ...params,
                                    modal: false,
                                    idx: "",
                                    now: Date.now(),
                                });

                                resetReplyParams();
                                resetReplyArray();
                            }}
                        ></button>
                    </div>
                    <div className="modal-body p-0">
                        <form onSubmit={handleSubmit} className="p-3">
                            <input name="idx" type="hidden" defaultValue={data.idx || ""} />
                            <input name="table" type="hidden" defaultValue={params.table || ""} />
                            <input name="board_id" type="hidden" defaultValue={data.board_id || params.board_id} />
                            <input name="id" type="hidden" defaultValue={data.id || getUser().id} />
                            <input name="name1" type="hidden" defaultValue={data.name1 || getUser().name1} />
                            <input name="step" type="hidden" defaultValue={"1"} />

                            <Field title="제목" name1="title" type="text" readOnly={false} required={true} defaultValue={data.title || ""} />
                            <Field title="내용" name1="memo" type="textarea" readOnly={false} required={true} defaultValue={data.memo || ""} />

                            <div className="d-flex flex-wrap">
                                {Array(10)
                                    .fill()
                                    .map((_, i) => (
                                        <ImageDropZone key={i} index={i} filename={data && eval(`data.filename${i}`)} />
                                    ))}
                            </div>

                            <div className="d-flex justify-content-between">
                                <div></div>
                                <button type="submit" className="btn btn-primary btn-sm">
                                    등록
                                </button>
                            </div>
                        </form>

                        {params.idx && <hr />}
                        {params.idx && <Reply idx={params.idx} />}
                    </div>
                </div>
            </div>
        </div>
    );
};
