import React from "react";
import axios from "axios";
import Layout from "../../components/Layout";
import { writer, reader, uploader } from "../../utils/store";
import { getUser } from "../../utils/common";
import Card from "../../components/Card";
import Field from "../../components/Field";
import ImageDropZone from "../../components/ImageDropZone";
import { useRecoilState, useResetRecoilState } from "recoil";
import { toastState, fileObjectState, loadingState } from "../../utils/atom";
import { useEffect, useState } from "react";

export default () => {
    const [loading, setLoading] = useRecoilState(loadingState);
    const [toast, setToast] = useRecoilState(toastState);

    const [fileObject, setFileObject] = useRecoilState(fileObjectState);
    const resetFileObject = useResetRecoilState(fileObjectState);

    const [data, setData] = useState({});

    useEffect(() => {
        getData();
    }, []);

    const getData = async () => {
        setLoading(true);
        const data = await reader({ idx: getUser().idx, table: "MEMB_tbl" });
        setData(data);
        setLoading(false);
    };

    if (!data) {
        return setLoading(true);
    }

    const handleSubmit = async (e) => {
        setLoading(true);
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
        const data2 = await writer(frm);
        console.log(data2);

        setToast({
            isToast: true,
            message: frm.idx ? "수정 되었습니다." : "등록 되었습니다.",
        });
        setLoading(false);
    };

    return (
        <Layout>
            <Card>
                <form onSubmit={handleSubmit} className="p-3">
                    <input type="hidden" name="table" defaultValue="MEMB_tbl" />
                    <input type="hidden" name="idx" defaultValue={data.idx} />
                    <Field title="아이디" name1="id" type="text" readOnly={true} required={true} defaultValue={data.id} />
                    <Field title="패스워드" name1="pass1" type="password" placeholder="변경시에만 입력하세요." defaultValue="" />
                    <Field title="이름" name1="name1" type="text" required={true} defaultValue={data.name1} />

                    <ImageDropZone index={0} filename={data.filename0} />

                    <div className="d-flex justify-content-between">
                        <div></div>
                        <button type="submit" className="btn btn-primary btn-sm">
                            저장
                        </button>
                    </div>
                </form>
            </Card>
        </Layout>
    );
};
