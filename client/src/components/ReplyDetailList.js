import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { getUser } from "../utils/common";
import { writer, listor } from "../utils/store";
import { replyArrayState, replyParamsState } from "../utils/atom";
import ReplyBody from "./ReplyBody";

export default () => {
    const [replyArray, setReplyArray] = useRecoilState(replyArrayState);
    const [replyParams, setReplyParams] = useRecoilState(replyParamsState);

    const [data, setData] = useState(null);

    useEffect(() => {
        getData();
    }, [replyParams.now]);

    const getData = async () => {
        const url = `/article/reply_detail/${replyParams.parent_idx}/${getUser().id}`;
        const data = await listor(url);
        setData(data);
    };

    if (!data) {
        return "";
    }

    console.log(data, replyParams);

    return (
        <div className="modal bg-dark bg-opacity-50" style={{ display: "block" }}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => {
                                //모달창에 나온데이터를 복사해서 부모 리스트에 넣어버린다!
                                const arr = [...replyArray];
                                const index = arr.findIndex((item) => item.idx == replyParams.parent_idx);
                                arr[index] = {
                                    ...data[0],
                                };
                                //

                                console.log(arr);

                                setReplyArray(arr);

                                setReplyParams({
                                    ...replyParams,
                                    parent_idx: "",
                                    modal: false,
                                });
                            }}
                        ></button>
                    </div>
                    <div className="modal-body p-0">
                        {data.map((row, i) => (
                            <div key={i} style={{ fontSize: "14px" }}>
                                <ReplyBody row={row} />
                            </div>
                        ))}
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const frm = Object.fromEntries(new FormData(e.target).entries());
                                e.target.memo.value = "";
                                const data2 = await writer(frm);

                                setReplyParams({
                                    ...replyParams,
                                    now: Date.now(),
                                });
                            }}
                        >
                            <input type="hidden" name="table" value={replyParams.table} />
                            <input type="hidden" name="step" value="3" />
                            <input type="hidden" name="parent_idx" value={replyParams.parent_idx} />
                            <input type="hidden" name="id" value={getUser().id} />
                            <input type="hidden" name="name1" value={getUser().name1} />

                            <div className="input-group input-group-sm mb-3 p-3">
                                <textarea name="memo" className="form-control" rows="3" placeholder="내용을 입력해주세요." required></textarea>
                                <button className="btn btn-outline-secondary" type="submit">
                                    댓글남기기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
