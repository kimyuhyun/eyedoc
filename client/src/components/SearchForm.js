import { useRecoilState } from "recoil";
import { paramsState } from "../utils/atom";

export default ({ columns }) => {
    const [params, setParams] = useRecoilState(paramsState);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                setParams({
                    ...params,
                    page: 1,
                    search_column: e.target.search_column.value,
                    search_value: e.target.search_value.value,
                    orderby: "idx DESC",
                    now: Date.now(),
                });
            }}
            className="mb-4"
        >
            <div className="row">
                <div className="col-12 col-lg-8 offset-lg-4">
                    <div className="input-group input-group-sm">
                        <select className="form-select" name="search_column" defaultValue={params.search_column}>
                            {columns.map((row, i) => (
                                <option key={i} value={row.value}>
                                    {row.text}
                                </option>
                            ))}
                        </select>

                        <input type="text" className="form-control" placeholder="검색어를 입력해주세요" name="search_value" defaultValue={params.search_value} />
                        <button className="btn btn-primary" type="submit">
                            검색
                        </button>
                        <button
                            onClick={() => {
                                setParams({
                                    ...params,
                                    page: 1,
                                    search_column: "",
                                    search_value: "",
                                    orderby: "idx DESC",
                                    now: Date.now(),
                                });

                                document.querySelector("select[name='search_column']").options[0].selected = true;
                                document.querySelector("input[name='search_value']").value = "";
                            }}
                            type="button"
                            className="btn btn-outline-dark"
                        >
                            목록
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};
