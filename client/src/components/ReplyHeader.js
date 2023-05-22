import { useResetRecoilState, useRecoilState } from "recoil";
import { replyParamsState, replyArrayState } from "../utils/atom";
import { useEffect } from "react";

export default ({ page_helper }) => {
    const resetReplyArray = useResetRecoilState(replyArrayState);
    const [replyParams, setReplyParams] = useRecoilState(replyParamsState);

    useEffect(() => {
        console.log("useEffect", replyParams.scroll);
        document.querySelector(".modal-body").scrollTop = replyParams.scroll;
    }, [replyParams.scroll]);

    if (!page_helper) {
        return "";
    }

    return (
        <>
            {page_helper.pnTotal > 0 && (
                <div className="py-2 px-3 border-bottom bg-white">
                    <button
                        className={`btn btn-sm ${replyParams.sort1 == "time" ? "btn-primary" : "btn-link"}`}
                        onClick={() => {
                            resetReplyArray();
                            setReplyParams({
                                ...replyParams,
                                page: 1,
                                sort1: "time",
                                now: Date.now(),
                            });
                        }}
                    >
                        시간순
                    </button>

                    <button
                        className={`btn btn-sm ${replyParams.sort1 == "latest" ? "btn-primary" : "btn-link"}`}
                        onClick={() => {
                            resetReplyArray();
                            setReplyParams({
                                ...replyParams,
                                page: 1,
                                sort1: "latest",
                                now: Date.now(),
                            });
                        }}
                    >
                        최신순
                    </button>
                </div>
            )}
            {replyParams.sort1 == "time" && page_helper.pageNum < page_helper.pnEnd && (
                <div className="py-2 px-3 border-bottom bg-white d-flex flex-row justify-content-between">
                    <button
                        className="btn btn-sm btn-link"
                        onClick={() => {
                            const scrollTop = document.querySelector(".modal-body").scrollTop;
                            setReplyParams({
                                ...replyParams,
                                page: page_helper.pageNum + 1,
                                scroll: scrollTop,
                                now: Date.now(),
                            });
                        }}
                    >
                        + 이전 페이지 더보기
                    </button>
                </div>
            )}
        </>
    );
};
