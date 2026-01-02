/* Admin JavaScript for Culturata Brand Suitability */

(function ($) {
    'use strict';

    // Analyze single post
    window.culturataBsAnalyze = function (postId) {
        const button = event.target;
        const originalText = button.textContent;

        button.disabled = true;
        button.textContent = culturataBsData.strings.analyzing;

        // Get post data
        const title = $('#title').val() || document.getElementById('post-title-0')?.value;
        const content = wp.data ? wp.data.select('core/editor').getEditedPostAttribute('content') : $('#content').val();
        const excerpt = wp.data ? wp.data.select('core/editor').getEditedPostAttribute('excerpt') : $('#excerpt').val();

        $.ajax({
            url: culturataBsData.apiUrl + '/analyze',
            method: 'POST',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-WP-Nonce', culturataBsData.nonce);
            },
            data: JSON.stringify({
                title: title,
                content: content,
                excerpt: excerpt,
                post_id: postId
            }),
            contentType: 'application/json',
            success: function (response) {
                if (response.success) {
                    location.reload();
                } else {
                    alert(culturataBsData.strings.error + ': ' + (response.error || 'Unknown error'));
                    button.disabled = false;
                    button.textContent = originalText;
                }
            },
            error: function (xhr) {
                let errorMsg = culturataBsData.strings.error;
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg += ': ' + xhr.responseJSON.message;
                }
                alert(errorMsg);
                button.disabled = false;
                button.textContent = originalText;
            }
        });
    };

    // Re-analyze (alias)
    window.culturataBsReanalyze = window.culturataBsAnalyze;

    // Bulk analysis functionality
    $(document).ready(function () {
        const bulkApp = $('#culturata-bulk-analysis-app');

        if (bulkApp.length) {
            initBulkAnalysis();
        }
    });

    function initBulkAnalysis() {
        const container = $('#culturata-bulk-analysis-app');

        const html = `
            <div class="culturata-bulk-analysis">
                <div style="background: white; padding: 20px; border: 1px solid #ccc; border-radius: 4px;">
                    <h3>Select Posts to Analyze</h3>
                    <p>
                        <label>
                            <input type="checkbox" id="bulk-select-published" checked>
                            Published posts
                        </label>
                        &nbsp;&nbsp;
                        <label>
                            <input type="checkbox" id="bulk-select-drafts">
                            Draft posts
                        </label>
                        &nbsp;&nbsp;
                        <label>
                            <input type="number" id="bulk-limit" value="10" min="1" max="100" style="width: 60px;">
                            posts at a time
                        </label>
                    </p>
                    <button class="button button-primary" id="bulk-analyze-start">Start Bulk Analysis</button>
                    <div id="bulk-progress" style="margin-top: 20px; display: none;">
                        <div style="background: #f0f0f1; height: 30px; border-radius: 4px; overflow: hidden;">
                            <div id="bulk-progress-bar" style="background: #2271b1; height: 100%; width: 0%; transition: width 0.3s;"></div>
                        </div>
                        <p id="bulk-status" style="margin-top: 10px; font-weight: bold;"></p>
                        <div id="bulk-results" style="margin-top: 15px; max-height: 400px; overflow-y: auto;"></div>
                    </div>
                </div>
            </div>
        `;

        container.html(html);

        $('#bulk-analyze-start').on('click', function () {
            startBulkAnalysis();
        });
    }

    async function startBulkAnalysis() {
        const includePublished = $('#bulk-select-published').is(':checked');
        const includeDrafts = $('#bulk-select-drafts').is(':checked');
        const limit = parseInt($('#bulk-limit').val());

        $('#bulk-progress').show();
        $('#bulk-analyze-start').prop('disabled', true);

        // Get posts
        const posts = await fetchPostsToAnalyze(includePublished, includeDrafts, limit);

        if (!posts || posts.length === 0) {
            $('#bulk-status').text('No posts found to analyze.');
            $('#bulk-analyze-start').prop('disabled', false);
            return;
        }

        let completed = 0;
        const total = posts.length;

        for (const post of posts) {
            try {
                const result = await analyzePost(post);
                completed++;

                const percentage = (completed / total) * 100;
                $('#bulk-progress-bar').css('width', percentage + '%');
                $('#bulk-status').text(`Analyzed ${completed} of ${total} posts...`);

                const resultHtml = `
                    <div style="padding: 10px; margin-bottom: 8px; background: ${result.success ? '#d1fae5' : '#fee2e2'}; border-radius: 4px;">
                        <strong>${post.title}</strong>: ${result.success ? '✓ Score: ' + result.score : '✗ Error: ' + result.error}
                    </div>
                `;
                $('#bulk-results').prepend(resultHtml);

                // Small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error('Error analyzing post:', post.id, error);
            }
        }

        $('#bulk-status').text(`✓ Completed! Analyzed ${completed} posts.`);
        $('#bulk-analyze-start').prop('disabled', false);
    }

    async function fetchPostsToAnalyze(includePublished, includeDrafts, limit) {
        const statuses = [];
        if (includePublished) statuses.push('publish');
        if (includeDrafts) statuses.push('draft');

        if (statuses.length === 0) return [];

        try {
            const response = await $.ajax({
                url: '/wp-json/wp/v2/posts',
                method: 'GET',
                data: {
                    per_page: limit,
                    status: statuses.join(','),
                    _fields: 'id,title,content,excerpt'
                },
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', culturataBsData.nonce);
                }
            });

            return response.map(post => ({
                id: post.id,
                title: post.title.rendered,
                content: post.content.rendered,
                excerpt: post.excerpt.rendered
            }));
        } catch (error) {
            console.error('Error fetching posts:', error);
            return [];
        }
    }

    async function analyzePost(post) {
        try {
            const response = await $.ajax({
                url: culturataBsData.apiUrl + '/analyze',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    title: post.title,
                    content: post.content,
                    excerpt: post.excerpt,
                    post_id: post.id
                }),
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', culturataBsData.nonce);
                }
            });

            if (response.success && response.data) {
                return {
                    success: true,
                    score: response.data.overallScore
                };
            } else {
                return {
                    success: false,
                    error: response.error || 'Unknown error'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.responseJSON?.message || error.statusText || 'Request failed'
            };
        }
    }

})(jQuery);
