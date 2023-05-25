import { useSearchParams } from "react-router-dom";

export default ({ pageHelper, setPage }) => {
    if (!pageHelper) {
        return "";
    }

    if (!pageHelper.pnTotal) {
        return "";
    }

    const pageLength = pageHelper.pnEnd - pageHelper.pnStart + 1;
    if (pageLength < 1) {
        return "";
    }

    return (
        <div className="d-flex justify-content-center">
            <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${pageHelper.pnPrev == 0 && "disabled"}`}>
                    <button onClick={() => setPage(pageHelper.pnPrev)} className="page-link">
                        <i className="bi bi-chevron-left"></i>
                    </button>
                </li>
                {Array(pageLength)
                    .fill()
                    .map((_, i) => (
                        <li key={i} className={`page-item ${pageHelper.pageNum == pageHelper.pnStart + i && "active"}`}>
                            <button type="button" onClick={() => setPage(pageHelper.pnStart + i)} className="page-link">
                                {pageHelper.pnStart + i}
                            </button>
                        </li>
                    ))}

                <li className={`page-item ${pageHelper.pnNext == 0 && "disabled"}`}>
                    <button onClick={() => setPage(pageHelper.pnNext)} className="page-link">
                        <i className="bi bi-chevron-right"></i>
                    </button>
                </li>
            </ul>
        </div>
    );
};
