(function (wp) {
    const { registerPlugin } = wp.plugins;
    const { PluginSidebar, PluginSidebarMoreMenuItem } = wp.editPost;
    const { PanelBody, Button, Spinner, Notice } = wp.components;
    const { Component, Fragment } = wp.element;
    const { withSelect, withDispatch } = wp.data;
    const { compose } = wp.compose;
    const { __ } = wp.i18n;

    class BrandSuitabilityPanel extends Component {
        constructor(props) {
            super(props);
            this.state = {
                isAnalyzing: false,
                analysis: null,
                error: null,
                lastAnalyzedContent: null
            };
        }

        componentDidMount() {
            this.loadExistingAnalysis();
        }

        loadExistingAnalysis = async () => {
            const { postId } = culturataBsGutenberg;

            if (!postId) return;

            try {
                const response = await wp.apiFetch({
                    path: `/culturata-bs/v1/analysis/${postId}`,
                    method: 'GET'
                });

                if (response && response.data) {
                    this.setState({ analysis: response.data });
                }
            } catch (error) {
                // No existing analysis, that's ok
            }
        };

        analyzeContent = async () => {
            const { title, content, excerpt } = this.props;
            const { postId } = culturataBsGutenberg;

            if (!title || !content) {
                this.setState({
                    error: __('Please add a title and content before analyzing.', 'culturata-brand-suitability')
                });
                return;
            }

            this.setState({
                isAnalyzing: true,
                error: null
            });

            try {
                const response = await wp.apiFetch({
                    path: '/culturata-bs/v1/analyze',
                    method: 'POST',
                    data: {
                        title,
                        content,
                        excerpt,
                        post_id: postId
                    }
                });

                if (response.success && response.data) {
                    this.setState({
                        analysis: response.data,
                        isAnalyzing: false,
                        lastAnalyzedContent: content,
                        error: null
                    });
                } else {
                    throw new Error(response.error || 'Analysis failed');
                }
            } catch (error) {
                this.setState({
                    isAnalyzing: false,
                    error: error.message || __('Failed to analyze content', 'culturata-brand-suitability')
                });
            }
        };

        renderScore() {
            const { analysis } = this.state;

            if (!analysis) return null;

            const { overallScore, scoreSummary, garmRiskLevel } = analysis;

            return (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{
                        fontSize: '64px',
                        fontWeight: 'bold',
                        color: scoreSummary?.color || '#666',
                        lineHeight: '1'
                    }}>
                        {overallScore}
                    </div>
                    <div style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '10px 0',
                        color: scoreSummary?.color || '#666'
                    }}>
                        {scoreSummary?.label || 'Score'}
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: '#666',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        GARM: {garmRiskLevel}
                    </div>
                </div>
            );
        }

        renderRiskFlags() {
            const { analysis } = this.state;

            if (!analysis || !analysis.riskFlags || analysis.riskFlags.length === 0) {
                return null;
            }

            const severityColors = {
                low: '#3b82f6',
                medium: '#f59e0b',
                high: '#ef4444'
            };

            return (
                <div style={{ marginTop: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                        {__('Risk Flags', 'culturata-brand-suitability')}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {analysis.riskFlags.map((flag, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '8px',
                                    background: '#f9fafb',
                                    borderLeft: `3px solid ${severityColors[flag.severity] || '#999'}`,
                                    borderRadius: '2px',
                                    fontSize: '13px'
                                }}
                            >
                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                    {flag.type}
                                </div>
                                <div style={{ color: '#666', fontSize: '12px' }}>
                                    {flag.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        renderIABCategories() {
            const { analysis } = this.state;

            if (!analysis || !analysis.iabCategories || analysis.iabCategories.length === 0) {
                return null;
            }

            return (
                <div style={{ marginTop: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                        {__('IAB Categories', 'culturata-brand-suitability')}
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {analysis.iabCategories.slice(0, 5).map((category, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '4px 10px',
                                    background: '#e0e7ff',
                                    color: '#3730a3',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                }}
                            >
                                {category.name}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        render() {
            const { isAnalyzing, analysis, error } = this.state;

            return (
                <Fragment>
                    <PluginSidebarMoreMenuItem target="culturata-brand-suitability-sidebar">
                        {__('Brand Suitability', 'culturata-brand-suitability')}
                    </PluginSidebarMoreMenuItem>

                    <PluginSidebar
                        name="culturata-brand-suitability-sidebar"
                        title={__('Brand Suitability', 'culturata-brand-suitability')}
                        icon="shield-alt"
                    >
                        <PanelBody>
                            {error && (
                                <Notice status="error" isDismissible={false}>
                                    {error}
                                </Notice>
                            )}

                            {analysis && this.renderScore()}
                            {analysis && this.renderRiskFlags()}
                            {analysis && this.renderIABCategories()}

                            {analysis && analysis.reasoning && (
                                <div style={{ marginTop: '15px', padding: '10px', background: '#f9fafb', borderRadius: '4px' }}>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
                                        {__('Analysis Summary', 'culturata-brand-suitability')}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: '1.5' }}>
                                        {analysis.reasoning}
                                    </p>
                                </div>
                            )}

                            <Button
                                isPrimary
                                isBusy={isAnalyzing}
                                disabled={isAnalyzing}
                                onClick={this.analyzeContent}
                                style={{ width: '100%', marginTop: '15px', justifyContent: 'center' }}
                            >
                                {isAnalyzing ? (
                                    <Fragment>
                                        <Spinner />
                                        {__('Analyzing...', 'culturata-brand-suitability')}
                                    </Fragment>
                                ) : (
                                    analysis ? __('Re-analyze', 'culturata-brand-suitability') : __('Analyze Content', 'culturata-brand-suitability')
                                )}
                            </Button>

                            {analysis && analysis.cached && (
                                <p style={{ fontSize: '11px', color: '#999', textAlign: 'center', marginTop: '8px' }}>
                                    {__('Cached result', 'culturata-brand-suitability')}
                                </p>
                            )}
                        </PanelBody>
                    </PluginSidebar>
                </Fragment>
            );
        }
    }

    const BrandSuitabilityPanelWithData = compose([
        withSelect((select) => {
            const editor = select('core/editor');
            return {
                title: editor.getEditedPostAttribute('title'),
                content: editor.getEditedPostAttribute('content'),
                excerpt: editor.getEditedPostAttribute('excerpt')
            };
        })
    ])(BrandSuitabilityPanel);

    registerPlugin('culturata-brand-suitability', {
        render: BrandSuitabilityPanelWithData
    });
})(window.wp);
