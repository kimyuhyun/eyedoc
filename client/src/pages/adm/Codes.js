import { useEffect, useState, useRef } from "react";
import Layout from "../../components/Layout";
import { DiCss3, DiJavascript, DiNpm } from "react-icons/di";
import { Falistor, FaRegFolder, FaRegFolderOpen } from "react-icons/fa";
import TreeView, { flattenTree } from "react-accessible-treeview";
import Field from "../../components/Field";
import { tokenIssue } from "../../utils/store";
import { useRecoilState } from "recoil";
import { loadingState } from "../../utils/atom";
import axios from "axios";

const nodeArr = [];

export default () => {
    const [loading, setLoading] = useRecoilState(loadingState);
    const [values, setValues] = useState({});
    const [expandedIds, setExpandedIds] = useState([]);

    const [data, setData] = useState({ list: [], codes: [], sorts: [] });

    var codes = [];
    var sorts = [];

    useEffect(() => {
        getData();
    }, []);

    const getData = async () => {
        setLoading(true);
        const token = await tokenIssue();
        const { data } = await axios({
            url: `/codes`,
            method: "GET",
            headers: { token },
        });
        setData(data);
        setLoading(false);
        data.codes.map((_, i) => {
            nodeArr.push(i);
        });
    };

    if (!data) {
        return "error";
    }

    if (data.code == 0) {
        return data.msg;
    }

    const handleClick = (e) => {
        if (e.isSelected) {
            setValues({
                ...values,
                code1: codes[e.element.id],
                sort1: sorts[e.element.id],
                name1: e.element.name,
            });
        }
    };

    const handelChange = (e) => {
        setValues({
            ...values,
            [e.target.name]: e.target.value,
        });
    };

    const handleSave = async () => {
        setLoading(true);
        const token = await tokenIssue();
        await axios({
            url: `/codes/update`,
            method: "POST",
            data: values,
            headers: { token },
        });
        getData();
    };

    const handleAdd = async (seq) => {
        const token = await tokenIssue();
        setLoading(true);
        const code1 = codes[seq];
        console.log(code1);
        await axios({
            url: `/codes/add`,
            method: "POST",
            data: { code1 },
            headers: { token },
        });
        getData();
    };

    const handleAddRoot = async () => {
        const token = await tokenIssue();
        setLoading(true);
        await axios({
            url: `/codes/add`,
            method: "POST",
            data: { code1: "root" },
            headers: { token },
        });
        getData();
    };

    const handleDel = async (seq) => {
        if (!window.confirm("삭제 하시겠습니까?")) {
            return;
        }

        const token = await tokenIssue();
        const code1 = codes[seq];
        console.log(code1);
        setLoading(true);
        await axios({
            url: `/codes/del`,
            method: "POST",
            data: { code1 },
            headers: { token },
        });
        getData();
    };

    const json = flattenTree(data.list);

    codes = [...data.codes];
    sorts = [...data.sorts];

    return (
        <Layout>
            <button className="btn btn-sm btn-link p-0" onClick={handleAddRoot}>
                [+추가]
            </button>
            <button onClick={() => setExpandedIds([...nodeArr])} type="button" className="btn btn-sm btn-link">
                [펼치기]
            </button>

            <button onClick={() => setExpandedIds([])} type="button" className="btn btn-sm btn-link">
                [접기]
            </button>

            <div className="row">
                <div className="col-12 col-md-4">
                    <div className="card shadow">
                        <div className="card-body">
                            <div className="directory">
                                <TreeView
                                    onSelect={(e) => handleClick(e)}
                                    expandedIds={expandedIds}
                                    data={json}
                                    aria-label="directory tree"
                                    nodeRenderer={({ element, isBranch, isExpanded, isSelected, getNodeProps, level }) => (
                                        <div className="d-flex flex-row">
                                            <div {...getNodeProps()} style={{ paddingLeft: 20 * (level - 1) }}>
                                                {isBranch ? <FolderIcon isOpen={isExpanded} /> : <FileIcon filename={element.name} />}
                                                {element.name}
                                            </div>

                                            <div className="text-end">
                                                {isSelected && level <= 4 && (
                                                    <div>
                                                        {level < 4 && (
                                                            <button className="btn btn-sm btn-link p-0" onClick={() => handleAdd(element.id)}>
                                                                [+]
                                                            </button>
                                                        )}
                                                        <button className="btn btn-sm btn-link text-danger p-0" onClick={() => handleDel(element.id)}>
                                                            [-]
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-8">
                    <div className="card shadow">
                        <div className="card-body">
                            <Field title="코드" name1="code1" type="text" readOnly={true} required={true} placeholder="" value={values.code1 || ""} handelChange={handelChange} />
                            <Field title="코드명" name1="name1" type="text" readOnly={false} required={true} placeholder="" value={values.name1 || ""} handelChange={handelChange} />
                            <Field title="순서" name1="sort1" type="text" readOnly={false} required={true} placeholder="" value={values.sort1 || ""} handelChange={handelChange} />
                            {values.code1 && (
                                <button type="button" className="btn btn-sm btn-primary" onClick={handleSave}>
                                    저장
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx="true">{`
                .directory {
                    font-family: monospace;
                    font-size: 16px;
                    color: black;
                    user-select: none;
                    padding: 0px;
                    border-radius: 0.4em;
                }

                .directory .tree,
                .directory .tree-node,
                .directory .tree-node-group {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .directory .tree-branch-wrapper,
                .directory .tree-node__leaf {
                    outline: none;
                    outline: none;
                }

                .directory .tree-node {
                    cursor: pointer;
                }

                .directory .tree-node:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .directory .tree .tree-node--focused {
                    background: rgba(255, 255, 255, 0.2);
                }

                .directory .tree .tree-node--selected {
                    background: rgba(48, 107, 176, 0.5);
                    flex: 1 1 auto !important;
                }

                .directory .tree-node__branch {
                    display: block;
                    flex: 1 1 auto !important;
                }

                .directory .icon {
                    vertical-align: middle;
                    padding-right: 5px;
                }
            `}</style>
        </Layout>
    );
};

const FolderIcon = ({ isOpen }) => (isOpen ? <FaRegFolderOpen color="f9a932" className="icon" /> : <FaRegFolder color="f9a932" className="icon" />);

const FileIcon = ({ filename }) => {
    return <DiNpm color="turquoise" className="icon" />;
    // const extension = filename.slice(filename.lastIndexOf(".") + 1);
    // switch (extension) {
    //     case "js":
    //         return <DiJavascript color="yellow" className="icon" />;
    //     case "css":
    //         return <DiCss3 color="turquoise" className="icon" />;
    //     case "json":
    //         return <FaList color="yellow" className="icon" />;
    //     case "npmignore":
    //         return <DiNpm color="red" className="icon" />;
    //     default:
    //         return null;
    // }
};
