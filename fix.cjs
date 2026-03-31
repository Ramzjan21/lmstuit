const fs = require('fs');

const files = [
    'course_detail.html',
    'courses_page.html',
    'dashboard.html',
    'deadlines.html',
    'finals.html',
    'info.html',
    'schedule.html',
    'studyplan.html',
    'subject.html'
];

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // Remove fixed classes from body
        content = content.replace(/<body class="page-sidebar-fixed page-header-fixed">/g, '<body class="page-static">');
        
        // Add some responsive CSS before </head> to ensure proper static layout on mobile
        const customCss = `
    <style>
        @media (max-width: 768px) {
            body.page-static .page-sidebar {
                position: static !important;
                height: auto !important;
                width: 100% !important;
            }
            body.page-static .page-header {
                position: static !important;
            }
            body.page-static .page-content {
                margin-left: 0 !important;
                padding-top: 0 !important;
            }
            body.page-static .page-container {
                display: flex;
                flex-direction: column;
            }
            body.page-static .navbar {
                margin-bottom: 0 !important;
            }
            body.page-static #sidebar-menu {
                height: auto !important;
                overflow: visible !important;
            }
        }
    </style>
</head>`;
        
        content = content.replace(/<\/head>/g, customCss);
        fs.writeFileSync(file, content);
        console.log('Fixed ' + file);
    }
}
