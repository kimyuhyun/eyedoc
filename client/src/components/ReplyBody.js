import { useState } from "react";
import { useRecoilState } from "recoil";
import { replyParamsState, replyArrayState } from "../utils/atom";
import { writer, tokenIssue } from "../utils/store";

export default ({ row }) => {
    return (
        <>
            <Step2 row={row} />
            {row.list.map((row2, j) => (
                <div key={j}>{row2.step == 3 ? <Step3 row={row2} /> : <Step4 row={row2} />}</div>
            ))}
        </>
    );
};

const Step2 = ({ row }) => {
    const [replyArray, setReplyArray] = useRecoilState(replyArrayState);
    const [replyParams, setReplyParams] = useRecoilState(replyParamsState);
    const [replyModifyIndex, setReplyModifyIndex] = useState(-1);

    const updateRow = (newValue) => {
        const newArray = [...replyArray];
        const index = newArray.findIndex((item) => item.idx == newValue.idx);
        const obj = {
            ...newArray[index],
            ...newValue,
        };
        if (obj.is_use == 0) {
            obj.list = [];
        }
        newArray[index] = obj;
        setReplyArray(newArray);
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
                <div>
                    <i className={`bi bi-suit-heart${row.is_like == 1 ? "-fill" : ""}`} style={{ fontSize: "12px" }}></i>
                </div>
                <i className="bi bi-dot"></i>
                <div>{row.modified}</div>
                <div className="flex-fill text-end">
                    {!replyParams.modal && (
                        <button
                            className="btn btn-sm btn-link text-dark p-0"
                            onClick={() => {
                                setReplyParams({
                                    ...replyParams,
                                    modal: true,
                                    parent_idx: row.idx,
                                });
                            }}
                        >
                            [대댓글]
                        </button>
                    )}
                    <button className="btn btn-sm btn-link p-0" onClick={() => setReplyModifyIndex(row.idx)}>
                        [수정]
                    </button>
                    <button
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={async () => {
                            if (window.confirm("삭제 하시겠습니까?")) {
                                const frm = {
                                    table: replyParams.table,
                                    is_use: 0,
                                    idx: row.idx,
                                };
                                const newValue = await writer(frm);
                                newValue.step = row.step;
                                newValue.is_use = 0;
                                updateRow(newValue);

                                if (replyParams.modal) {
                                    setReplyParams({
                                        ...replyParams,
                                        now: Date.now(),
                                    });
                                }
                            }
                        }}
                    >
                        [삭제]
                    </button>
                </div>
            </div>
            <div className="d-flex flex-row">
                {replyModifyIndex == row.idx ? (
                    <form
                        onSubmit={async (e) => {
                            //수정!
                            e.preventDefault();
                            const frm = Object.fromEntries(new FormData(e.target).entries());
                            e.target.memo.value = "";
                            setReplyModifyIndex(-1);

                            const newValue = await writer(frm);
                            console.log(newValue);
                            newValue.step = row.step;
                            newValue.is_use = 1;
                            updateRow(newValue);

                            if (replyParams.modal) {
                                setReplyParams({
                                    ...replyParams,
                                    now: Date.now(),
                                });
                            }
                        }}
                        className="w-100"
                    >
                        <input type="hidden" name="table" readOnly value={replyParams.table || ""} />
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
    const [replyArray, setReplyArray] = useRecoilState(replyArrayState);
    const [replyParams, setReplyParams] = useRecoilState(replyParamsState);
    const [replyModifyIndex, setReplyModifyIndex] = useState(-1);

    const updateRow = (newValue) => {
        const array = [...replyArray];
        const index = array.findIndex((item) => item.idx == row.parent_idx);
        const array2 = [...array[index].list];
        const index2 = array2.findIndex((item) => item.idx == row.idx);

        const obj = {
            ...array2[index2],
            ...newValue,
        };
        obj.idx = eval(obj.idx);

        array2[index2] = {
            ...obj,
        };

        array[index] = {
            ...array[index],
            list: [...array2],
        };
        console.log(array);

        setReplyArray(array);
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
                <div>
                    <i className={`bi bi-suit-heart${row.is_like == 1 ? "-fill text-danger" : ""}`} style={{ fontSize: "12px" }}></i>
                </div>
                <i className="bi bi-dot"></i>
                <div>{row.modified}</div>
                <div className="flex-fill text-end">
                    <button className="btn btn-sm btn-link p-0" onClick={() => setReplyModifyIndex(row.idx)}>
                        [수정]
                    </button>
                    <button
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={async () => {
                            if (window.confirm("삭제 하시겠습니까?")) {
                                const frm = {
                                    table: replyParams.table,
                                    is_use: 0,
                                    idx: row.idx,
                                };
                                const newValue = await writer(frm);
                                newValue.step = row.step;
                                newValue.is_use = 0;
                                updateRow(newValue);

                                if (replyParams.modal) {
                                    setReplyParams({
                                        ...replyParams,
                                        now: Date.now(),
                                    });
                                }
                            }
                        }}
                    >
                        [삭제]
                    </button>
                </div>
            </div>
            <div className="d-flex flex-row">
                {replyModifyIndex == row.idx ? (
                    <form
                        onSubmit={async (e) => {
                            //수정!
                            e.preventDefault();
                            const frm = Object.fromEntries(new FormData(e.target).entries());
                            e.target.memo.value = "";
                            setReplyModifyIndex(-1);

                            const newValue = await writer(frm);
                            newValue.step = row.step;
                            newValue.is_use = 1;
                            updateRow(newValue);

                            if (replyParams.modal) {
                                setReplyParams({
                                    ...replyParams,
                                    now: Date.now(),
                                });
                            }
                        }}
                        className="w-100"
                    >
                        <input type="hidden" name="table" readOnly value={replyParams.table || ""} />
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
    const [replyParams, setReplyParams] = useRecoilState(replyParamsState);

    return (
        <div className="py-2 ps-5 border-bottom bg-light">
            <button
                className="btn btn-sm btn-link"
                onClick={() => {
                    setReplyParams({
                        ...replyParams,
                        modal: true,
                        parent_idx: row.parent_idx,
                        table: replyParams.table,
                        now: Date.now(),
                    });
                }}
            >
                {row.memo}
            </button>
        </div>
    );
};
