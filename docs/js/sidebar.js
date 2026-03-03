/**
 * Shared sidebar – injected into every page.
 * Each page only needs:
 *   <aside class="sidebar" id="sidebar"></aside>
 *   <script src="<path>/js/sidebar.js"></script>
 */
(function () {
    const sections = [
        {
            title: 'Applikasjoner',
            items: [
                { icon: '📡', label: 'reops-event-proxy', href: 'apps/reops-event-proxy.html' },
                { icon: '🔄', label: 'reops-umami-consumer', href: 'apps/reops-umami-consumer.html' },
                { icon: '📊', label: 'umami', href: 'apps/umami.html' },
                { icon: '🚀', label: 'innblikk', href: 'apps/innblikk.html' },
                { icon: '🔀', label: 'umami-proxy', href: 'apps/umami-proxy.html' },
            ],
        },
        {
            title: 'Tjenester',
            items: [
                { icon: '🗄️', label: 'bigquery', href: 'tjenester/bigquery.html' },
            ],
        },
        {
            title: 'Guider',
            items: [
                { icon: '📖', label: 'kom i gang med sporing', href: 'guider/kom-i-gang-med-sporing.html' },
            ],
        },
    ];

    // Work out the path prefix from root based on the script's own src attribute.
    // Pages in root (index.html) → "", pages in apps/ → "../", etc.
    var prefix = '';
    var scripts = document.querySelectorAll('script[src*="sidebar.js"]');
    if (scripts.length) {
        var src = scripts[scripts.length - 1].getAttribute('src');
        // src is e.g. "js/sidebar.js" or "../js/sidebar.js" or "../../js/sidebar.js"
        var parts = src.split('/');
        // Remove the filename ("sidebar.js") and the folder ("js"), the rest are "../" segments
        parts.pop(); // sidebar.js
        parts.pop(); // js
        prefix = parts.length ? parts.join('/') + '/' : '';
    }

    // Determine current page path relative to docs root for active-state matching
    var currentPath = window.location.pathname;

    function isActive(href) {
        var full = prefix + href;
        // Normalise: resolve the relative URL against the current page
        var a = document.createElement('a');
        a.href = full;
        return a.pathname === currentPath || currentPath.endsWith('/' + href);
    }

    var html = '<div class="sidebar-title"><a href="' + prefix + 'index.html">#Researchops</a></div>';

    sections.forEach(function (section, idx) {
        html += '<div class="sidebar-section"' + (idx > 0 ? ' style="margin-top:1.25rem"' : '') + '>' + section.title + '</div>';
        html += '<nav>';
        section.items.forEach(function (item) {
            var active = isActive(item.href) ? ' class="active"' : '';
            html += '<a href="' + prefix + item.href + '"' + active + '>';
            html += '<span class="icon">' + item.icon + '</span> ' + item.label;
            html += '</a>';
        });
        html += '</nav>';
    });

    var el = document.getElementById('sidebar');
    if (el) el.innerHTML = html;
})();

