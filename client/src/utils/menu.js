const menu = [
    {
        icon: "bi-person-circle",
        title: "회원관리",
        child: [
            {
                title: "권한 관리",
                link: "/adm/grade",
            },
            {
                title: "관리자 관리",
                link: "/adm/manager",
            },
            {
                title: "회원 관리",
                link: "/adm/user",
            },
        ],
    },
    // {
    //     icon: "bi-code-slash",
    //     title: "코드관리",
    //     child: [
    //         {
    //             title: "코드관리",
    //             link: "/adm/codes",
    //         },
    //     ],
    // },
    {
        icon: "bi-layout-text-window-reverse",
        title: "커뮤니티",
        child: [
            {
                title: "커뮤니티",
                link: "/adm/article/comm",
            },
            // {
            //     title: "뉴스레터",
            //     link: "/adm/article/news",
            // },
        ],
    },
    {
        icon: "bi bi-person-circle",
        title: "고객센터",
        child: [
            {
                title: "공지사항",
                link: "/adm/article/notice",
            },
            {
                title: "자주묻는질문",
                link: "/adm/article/faq",
            },
            {
                title: "1:1문의",
                link: "/adm/article/cscenter",
            },
            {
                title: "신고",
                link: "/adm/article/singo",
            },
        ],
    },
    {
        icon: "bi-bar-chart",
        title: "통계",
        child: [
            {
                title: "전체방문자",
                link: "/adm/analyzer/graph1",
            },
            {
                title: "트래픽수",
                link: "/adm/analyzer/graph2",
            },
            {
                title: "시간대별",
                link: "/adm/analyzer/graph3",
            },
            {
                title: "현재접속자",
                link: "/adm/liveuser",
            },
        ],
    },
];
module.exports = menu;
