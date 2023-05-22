import { getUser } from "../utils/common";
import { writer, listor } from "../utils/store";
import { useEffect, useState } from "react";
import ReplyHeader from "./ReplyHeader";
import ReplyFooter from "./ReplyFooter";
import ReplyBody from "./ReplyBody";
import { useRecoilState } from "recoil";
import { replyParamsState, replyArrayState, loadingState } from "../utils/atom";
import ReplyDetailList from "./ReplyDetailList";

export default ({ idx, table }) => {
    const [loading, setLoading] = useRecoilState(loadingState);

    const [replyArray, setReplyArray] = useRecoilState(replyArrayState);
    const [replyParams, setReplyParams] = useRecoilState(replyParamsState);

    const [data, setData] = useState({});

    useEffect(() => {
        if (!replyParams.modal) {
            getData();
        }
    }, [replyParams.now]);

    const getData = async () => {
        console.log("getData");
        setLoading(true);
        const url = `/article/reply_list/${idx}/${getUser().id}?page=${replyParams.page}&sort1=${replyParams.sort1}`;
        const data = await listor(url);
        setData(data);

        var tmp = [];
        if (replyParams.sort1 == "time") {
            //배열 앞에 붙이기!
            tmp = [...data.list, ...replyArray];
        } else {
            //배열 뒤에 붙이기!
            tmp = [...replyArray, ...data.list];
        }

        console.log(tmp);

        const tmpArr = []; 
        var oldIdx = 0;
        for (const o of tmp) {
            if (o.idx != oldIdx) {
                tmpArr.push(o);
                oldIdx = o.idx;
            }
        }

        setReplyArray([...tmpArr]);

        setLoading(false);

        setReplyParams({
            ...replyParams,
            table,
            idx,
        });
    };

    if (!data) {
        return setLoading(true);
    }

    console.log(replyArray, data);

    return (
        <>
            <h3 className="ms-3">댓글</h3>
            <ReplyHeader page_helper={data.page_helper} />
            {replyArray.map((row, i) => (
                <div key={i} style={{ fontSize: "14px" }}>
                    <ReplyBody row={row} />
                </div>
            ))}
            <ReplyFooter page_helper={data.page_helper} />

            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    const frm = Object.fromEntries(new FormData(e.target).entries());
                    const data = await writer(frm);
                    console.log(data);
                    e.target.memo.value = "";
                    const obj = {
                        idx: data.idx,
                        ...frm,
                        is_use: 1,
                        modified: "방금",
                        list: [],
                    };

                    if (replyParams.sort1 == "time") {
                        setReplyArray([...replyArray, obj]);
                    } else {
                        setReplyArray([obj, ...replyArray]);
                    }
                }}
            >
                <input type="hidden" name="table" value={table} />
                <input type="hidden" name="step" value="2" />
                <input type="hidden" name="parent_idx" value={idx} />
                <input type="hidden" name="id" value={getUser().id} />
                <input type="hidden" name="name1" value={getUser().name1} />

                <div className="input-group input-group-sm mb-3 p-3">
                    <textarea name="memo" className="form-control" rows="3" placeholder="내용을 입력해주세요." required></textarea>
                    <button className="btn btn-outline-secondary" type="submit">
                        댓글남기기
                    </button>
                </div>
            </form>
            {replyParams.modal && <ReplyDetailList />}
        </>
    );
};
