import { useRecoilState } from "recoil";
import { replyParamsState } from "../utils/atom";
import { useEffect } from "react";

export default ({ page_helper }) => {
    const [replyParams, setReplyParams] = useRecoilState(replyParamsState);

    useEffect(() => {
        console.log("useEffect", replyParams.scroll);
        document.querySelector(".modal-body").scrollTop = replyParams.scroll;
    }, [replyParams.scroll]);

    if (!page_helper) {
        return "";
    }
    if (!page_helper.pageNum) {
        return "";
    }

    return (
        <>
            {replyParams.sort1 == "latest" && (
                <div className="p-3">
                    {page_helper.pageNum < page_helper.pnEnd && (
                        <button
                            className="btn btn-sm btn-outline-secondary w-100"
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
                            더보기
                        </button>
                    )}
                </div>
            )}
        </>
    );
};
