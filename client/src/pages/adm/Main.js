import React from "react";
import { Link } from "react-router-dom";
import menu from "../../utils/menu";

import Layout from "../../components/Layout";


const Main = () => {
    return (
        <Layout>
            <div className="card shadow w-100">
                <div className="card-body">
                    <table className="table table-borderless table-sm">
                        <tbody>
                            {menu.map((row, i) => (
                                <tr key={i}>
                                    <th valign="middle">{row.title}</th>
                                    <td>
                                        {row.child.map((row2, j) => (
                                            <Link key={j} to={`${row2.link}`} className="btn btn-light me-2">
                                                {row2.title}
                                            </Link>
                                        ))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default Main;
