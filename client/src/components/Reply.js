import { getUser } from "../utils/common";
import { writer, listor } from "../utils/store";
import { useEffect, useState } from "react";
import ReplyBody from "./ReplyBody";
import ReplyDetailList from "./ReplyDetailList";
import ReplyPager from "./ReplyPager";
import { useSearchParams } from "react-router-dom";

export default ({ idx }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [page, setPage] = useState(1);
    const [pageHelper, setPageHelper] = useState({});

    const refresh = searchParams.get("refresh");
    const modal = searchParams.get("modal");

    useEffect(() => {
        (async () => {
            getData();
        })();
    }, [refresh, page]);

    const getData = async () => {
        setLoading(true);
        const url = `/article/reply_list/${idx}/${getUser().id}?page=${page}&sort1=time`;
        console.log("getData", url);
        const data = await listor(url);
        setData([...data.list]);
        setPageHelper(data.page_helper);
        setLoading(false);
    };

    if (!data) {
        return "";
    }

    console.log(data);

    return (
        <>
            <div className="d-flex justify-content-between pe-3">
                <h3 className="ms-3">댓글</h3>
                <ReplyPager pageHelper={pageHelper} setPage={setPage} />
            </div>
            {data.map((row, i) => (
                <div key={i} style={{ fontSize: "14px" }}>
                    <ReplyBody row={row} />
                </div>
            ))}

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
                    setPage(1);
                    getData();
                }}
            >
                <input type="hidden" name="table" value="BOARD_tbl" />
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
            {modal && <ReplyDetailList />}

            <ReplyPager pageHelper={pageHelper} setPage={setPage} />
            <br />
        </>
    );
};
