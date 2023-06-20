import axios from "axios";
import { paramsState } from "../utils/atom";
import { useRecoilState } from "recoil";
import { toastState } from "../utils/atom";
import { tokenIssue } from "../utils/store";

export default ({ children, columns, table }) => {
    const [params, setParams] = useRecoilState(paramsState);
    const [isToast, setToast] = useRecoilState(toastState);

    const chkList = document.querySelectorAll("input[name='idx']");
    for (const o of chkList) {
        o.checked = false;
    }

    const checkAll = (e) => {
        const chkList = document.querySelectorAll("input[name='idx']");
        for (const o of chkList) {
            o.checked = e.target.checked;
        }
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        const arr = [];
        if (e.target.idx.length == undefined) {
            arr.push(e.target.idx.value);
        } else {
            for (const obj of e.target.idx) {
                if (obj.checked) {
                    arr.push(obj.value);
                }
            }
        }

        if (arr.length > 0) {
            if (window.confirm("체크된 항목을 삭제 하시겠습니까?")) {
                const token = await tokenIssue();
                const url = `/crud/delete`;
                console.log(url);
                const { data } = await axios({
                    url,
                    method: "POST",
                    data: {
                        table,
                        idx: arr,
                    },
                    headers: { token },
                });
                setToast({
                    isToast: true,
                    message: data.msg,
                });

                setParams({
                    ...params,
                    now: Date.now(),
                });
            }
        }
    };

    return (
        <form onSubmit={handleDelete}>
            <table className="table table-sm">
                <tbody>
                    <tr>
                        <th className="text-center" style={{ width: "100px" }}>
                            <input type="checkbox" onClick={checkAll} />
                        </th>

                        {columns.map((row, i) => (
                            <th key={i} className="text-center text-nowrap" style={{ width: "100px" }}>
                                {row.textName}
                                {row.isSort && (
                                    <>
                                        <a
                                            onClick={() => {
                                                setParams({
                                                    ...params,
                                                    orderby: `${row.colName} DESC`,
                                                    now: Date.now(),
                                                });
                                            }}
                                            className={params.orderby == `${row.colName} DESC` ? "" : "text-dark"}
                                        >
                                            <i className="bi bi-arrow-down"></i>
                                        </a>
                                        <a
                                            onClick={() => {
                                                setParams({
                                                    ...params,
                                                    orderby: `${row.colName} ASC`,
                                                    now: Date.now(),
                                                });
                                            }}
                                            className={params.orderby == `${row.colName} ASC` ? "" : "text-dark"}
                                        >
                                            <i className="bi bi-arrow-up"></i>
                                        </a>
                                    </>
                                )}
                            </th>
                        ))}
                    </tr>
                    {children}
                </tbody>
            </table>

            <div className="d-flex justify-content-between">
                <button type="submit" className="btn btn-danger btn-sm">
                    삭제
                </button>
                {params.board_id !== "cscenter" && (
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                            setParams({
                                ...params,
                                modal: true,
                                idx: "",
                                table,
                            });
                        }}
                    >
                        등록
                    </button>
                )}
            </div>
        </form>
    );
};
