import { useState } from "react";
import { useRecoilState } from "recoil";
import { replyParamsState, replyArrayState } from "../utils/atom";
import { writer, tokenIssue } from "../utils/store";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

const table = "BOARD_tbl";

export default ({ row }) => {
    if (row.step == 2) {
        return <Step2 row={row} />;
    } else if (row.step == 3) {
        return <Step3 row={row} />;
    } else if (row.step == 4) {
        return <Step4 row={row} />;
    }
};

const Step2 = ({ row }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [modifyIndex, setModifyIndex] = useState(-1);

    const modal = searchParams.get("modal");
    const parentIdx = searchParams.get("parent_idx");

    const dataRefresh = () => {
        if (modal) {
            setSearchParams({ refresh: Date.now(), modal, parent_idx: parentIdx });
        } else {
            setSearchParams({ refresh: Date.now() });
        }
    };

    if (row.is_use == 0) {
        return (
            <div className="p-3 border-bottom bg-white">
                <div className="d-flex flex-row justify-content-between text-body-tertiary">
                    <div>삭제된 댓글 입니다.</div>
                    <div>{row.modified}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 border-bottom bg-white">
            <div className="d-flex flex-row text-body-tertiary">
                <div>{row.name1}</div>
                <i className="bi bi-dot"></i>
                <div>좋아요 {row.like_cnt}</div>
                <i className="bi bi-dot"></i>
                <div>댓글 {row.reply_cnt}</div>
                <i className="bi bi-dot"></i>
                <div>{row.created}</div>
                {row.created != row.modified && (
                    <>
                        <i className="bi bi-dot"></i>
                        <div>{row.modified} 수정됨</div>
                    </>
                )}
                <div className="flex-fill text-end">
                    {!modal && (
                        <button
                            className="btn btn-sm btn-link text-dark p-0"
                            onClick={() => {
                                setSearchParams({ modal: 1, parent_idx: row.idx });
                            }}
                        >
                            [대댓글]
                        </button>
                    )}
                    <button className="btn btn-sm btn-link p-0" onClick={() => setModifyIndex(row.idx)}>
                        [수정]
                    </button>
                    <button
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={async () => {
                            if (window.confirm("삭제 하시겠습니까?")) {
                                const frm = {
                                    table,
                                    is_use: 0,
                                    idx: row.idx,
                                };
                                await writer(frm);
                                dataRefresh();
                            }
                        }}
                    >
                        [삭제]
                    </button>
                </div>
            </div>
            <div className="d-flex flex-row">
                {modifyIndex == row.idx ? (
                    <form
                        onSubmit={async (e) => {
                            //수정!
                            e.preventDefault();
                            const frm = Object.fromEntries(new FormData(e.target).entries());
                            e.target.memo.value = "";
                            await writer(frm);
                            setModifyIndex(-1);
                            dataRefresh();
                        }}
                        className="w-100"
                    >
                        <input type="hidden" name="table" readOnly value={table} />
                        <input type="hidden" name="idx" readOnly value={row.idx} />
                        <div className="input-group input-group-sm mb-3 mt-3">
                            <textarea name="memo" className="form-control" rows="3" placeholder="내용을 입력해주세요." required defaultValue={row.memo} />
                            <button className="btn btn-outline-secondary" type="submit">
                                댓글수정
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="text-break" style={{ whiteSpace: "pre-wrap" }}>
                        {row.memo}
                    </div>
                )}
            </div>
        </div>
    );
};

const Step3 = ({ row }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [modifyIndex, setModifyIndex] = useState(-1);

    const modal = searchParams.get("modal");
    const parentIdx = searchParams.get("parent_idx");

    const dataRefresh = () => {
        if (modal) {
            setSearchParams({ refresh: Date.now(), modal, parent_idx: parentIdx });
        } else {
            setSearchParams({ refresh: Date.now() });
        }
    };

    if (row.is_use == 0) {
        return (
            <div className="py-3 ps-5 pe-3 border-bottom bg-light">
                <div className="d-flex flex-row justify-content-between text-body-tertiary">
                    <div>삭제된 댓글 입니다.</div>
                    <div>{row.modified}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-3 ps-5 pe-3 border-bottom bg-light">
            <div className="d-flex flex-row text-body-tertiary">
                <div>{row.name1}</div>
                <i className="bi bi-dot"></i>
                <div>좋아요 {row.like_cnt}</div>
                <i className="bi bi-dot"></i>
                <div>{row.created}</div>
                {row.created != row.modified && (
                    <>
                        <i className="bi bi-dot"></i>
                        <div>{row.modified} 수정됨</div>
                    </>
                )}
                <div className="flex-fill text-end">
                    <button className="btn btn-sm btn-link p-0" onClick={() => setModifyIndex(row.idx)}>
                        [수정]
                    </button>
                    <button
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={async () => {
                            if (window.confirm("삭제 하시겠습니까?")) {
                                const frm = {
                                    table,
                                    is_use: 0,
                                    idx: row.idx,
                                };
                                await writer(frm);
                                dataRefresh();
                            }
                        }}
                    >
                        [삭제]
                    </button>
                </div>
            </div>
            <div className="d-flex flex-row">
                {modifyIndex == row.idx ? (
                    <form
                        onSubmit={async (e) => {
                            //수정!
                            e.preventDefault();
                            const frm = Object.fromEntries(new FormData(e.target).entries());
                            e.target.memo.value = "";
                            setModifyIndex(-1);
                            await writer(frm);
                            dataRefresh();
                        }}
                        className="w-100"
                    >
                        <input type="hidden" name="table" readOnly value={table} />
                        <input type="hidden" name="idx" readOnly value={row.idx} />
                        <div className="input-group input-group-sm mb-3 mt-3">
                            <textarea name="memo" className="form-control" rows="3" placeholder="내용을 입력해주세요." required defaultValue={row.memo} />
                            <button className="btn btn-outline-secondary" type="submit">
                                댓글수정
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="text-break" style={{ whiteSpace: "pre-wrap" }}>
                        {row.memo}
                    </div>
                )}
            </div>
        </div>
    );
};

const Step4 = ({ row }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    return (
        <div className="py-2 ps-5 border-bottom bg-light">
            <button
                className="btn btn-sm btn-link"
                onClick={() => {
                    setSearchParams({ modal: 1, parent_idx: row.parent_idx });
                }}
            >
                {row.memo}
            </button>
        </div>
    );
};
