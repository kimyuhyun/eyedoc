import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { getUser } from "../utils/common";
import { writer, listor } from "../utils/store";
import { replyArrayState, replyParamsState } from "../utils/atom";
import ReplyBody from "./ReplyBody";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

const table = "BOARD_tbl";

export default () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState({ list: [] });

    const modal = searchParams.get("modal");
    const refresh = searchParams.get("refresh");
    const parentIdx = searchParams.get("parent_idx");

    useEffect(() => {
        getData();
    }, [refresh]);

    const getData = async () => {
        const url = `/article/reply_detail/${parentIdx}/${getUser().id}`;
        const data = await listor(url);
        setData(data);
    };

    if (!data) {
        return "";
    }

    console.log(data);

    return (
        <div className="modal bg-dark bg-opacity-50" style={{ display: "block" }}>
            <div className="modal-dialog modal-lg modal-lg modal-fullscreen-lg-down modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="btn-close" onClick={() => setSearchParams({})}></button>
                    </div>
                    <div className="modal-body p-0">
                        {data.list.map((row, i) => (
                            <div key={i} style={{ fontSize: "14px" }}>
                                <ReplyBody row={row} />
                            </div>
                        ))}

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const frm = Object.fromEntries(new FormData(e.target).entries());
                                e.target.memo.value = "";
                                await writer(frm);
                                setSearchParams({ refresh: Date.now(), modal, parent_idx: parentIdx });
                            }}
                        >
                            <input type="hidden" name="table" value={table} />
                            <input type="hidden" name="step" value="3" />
                            <input type="hidden" name="parent_idx" value={parentIdx} />
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
