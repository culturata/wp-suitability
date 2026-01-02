<?php
/**
 * Admin settings page
 */

if (!defined('ABSPATH')) {
    exit;
}

class Culturata_BS_Admin {

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('add_meta_boxes', array($this, 'add_meta_boxes'));
    }

    public function add_admin_menu() {
        add_menu_page(
            __('Brand Suitability', 'culturata-brand-suitability'),
            __('Brand Suitability', 'culturata-brand-suitability'),
            'manage_options',
            'culturata-brand-suitability',
            array($this, 'render_settings_page'),
            'dashicons-shield-alt',
            30
        );

        add_submenu_page(
            'culturata-brand-suitability',
            __('Settings', 'culturata-brand-suitability'),
            __('Settings', 'culturata-brand-suitability'),
            'manage_options',
            'culturata-brand-suitability',
            array($this, 'render_settings_page')
        );

        add_submenu_page(
            'culturata-brand-suitability',
            __('Bulk Analysis', 'culturata-brand-suitability'),
            __('Bulk Analysis', 'culturata-brand-suitability'),
            'manage_options',
            'culturata-bulk-analysis',
            array($this, 'render_bulk_analysis_page')
        );
    }

    public function register_settings() {
        register_setting('culturata_bs_settings', 'culturata_bs_settings', array($this, 'sanitize_settings'));

        add_settings_section(
            'culturata_bs_api_section',
            __('API Configuration', 'culturata-brand-suitability'),
            array($this, 'render_api_section'),
            'culturata-brand-suitability'
        );

        add_settings_field(
            'api_key',
            __('API Key', 'culturata-brand-suitability'),
            array($this, 'render_api_key_field'),
            'culturata-brand-suitability',
            'culturata_bs_api_section'
        );

        add_settings_field(
            'api_endpoint',
            __('API Endpoint', 'culturata-brand-suitability'),
            array($this, 'render_api_endpoint_field'),
            'culturata-brand-suitability',
            'culturata_bs_api_section'
        );

        add_settings_field(
            'auto_analyze',
            __('Auto-analyze on Publish', 'culturata-brand-suitability'),
            array($this, 'render_auto_analyze_field'),
            'culturata-brand-suitability',
            'culturata_bs_api_section'
        );
    }

    public function sanitize_settings($input) {
        $sanitized = array();

        if (isset($input['api_key'])) {
            $sanitized['api_key'] = sanitize_text_field($input['api_key']);
        }

        if (isset($input['api_endpoint'])) {
            $sanitized['api_endpoint'] = esc_url_raw($input['api_endpoint']);
        }

        $sanitized['auto_analyze'] = isset($input['auto_analyze']) ? 1 : 0;
        $sanitized['cache_duration'] = isset($input['cache_duration']) ? intval($input['cache_duration']) : 86400;

        return $sanitized;
    }

    public function render_api_section() {
        echo '<p>' . __('Configure your Culturata Brand Suitability API settings.', 'culturata-brand-suitability') . '</p>';
        echo '<p>' . sprintf(
            __('Don\'t have an API key? <a href="%s" target="_blank">Get one here</a>.', 'culturata-brand-suitability'),
            'https://culturata.com/api-keys'
        ) . '</p>';
    }

    public function render_api_key_field() {
        $settings = get_option('culturata_bs_settings', array());
        $api_key = isset($settings['api_key']) ? $settings['api_key'] : '';
        ?>
        <input type="text"
               name="culturata_bs_settings[api_key]"
               value="<?php echo esc_attr($api_key); ?>"
               class="regular-text"
               placeholder="sk-..." />
        <p class="description">
            <?php _e('Your Culturata API key for authentication', 'culturata-brand-suitability'); ?>
        </p>
        <?php
        if (!empty($api_key)) {
            $api_client = new Culturata_BS_API_Client();
            $profile = $api_client->get_user_profile();

            if (!is_wp_error($profile)) {
                ?>
                <div class="notice notice-success inline" style="margin: 10px 0; padding: 10px;">
                    <p><strong><?php _e('✓ Connected', 'culturata-brand-suitability'); ?></strong></p>
                    <p><?php printf(__('Tier: %s', 'culturata-brand-suitability'), esc_html($profile['tier'])); ?></p>
                    <p><?php printf(
                        __('Usage: %d / %d analyses this month', 'culturata-brand-suitability'),
                        $profile['usage']['current'],
                        $profile['usage']['limit']
                    ); ?></p>
                </div>
                <?php
            } else {
                ?>
                <div class="notice notice-error inline" style="margin: 10px 0; padding: 10px;">
                    <p><strong><?php _e('✕ Connection Failed', 'culturata-brand-suitability'); ?></strong></p>
                    <p><?php echo esc_html($profile->get_error_message()); ?></p>
                </div>
                <?php
            }
        }
    }

    public function render_api_endpoint_field() {
        $settings = get_option('culturata_bs_settings', array());
        $api_endpoint = isset($settings['api_endpoint']) ? $settings['api_endpoint'] : 'https://api.culturata.com/v1';
        ?>
        <input type="url"
               name="culturata_bs_settings[api_endpoint]"
               value="<?php echo esc_attr($api_endpoint); ?>"
               class="regular-text"
               placeholder="https://api.culturata.com/v1" />
        <p class="description">
            <?php _e('API endpoint URL (leave default unless instructed otherwise)', 'culturata-brand-suitability'); ?>
        </p>
        <?php
    }

    public function render_auto_analyze_field() {
        $settings = get_option('culturata_bs_settings', array());
        $auto_analyze = isset($settings['auto_analyze']) ? $settings['auto_analyze'] : 0;
        ?>
        <label>
            <input type="checkbox"
                   name="culturata_bs_settings[auto_analyze]"
                   value="1"
                   <?php checked($auto_analyze, 1); ?> />
            <?php _e('Automatically analyze posts when published', 'culturata-brand-suitability'); ?>
        </label>
        <p class="description">
            <?php _e('If enabled, posts will be analyzed automatically on publish (uses your API quota)', 'culturata-brand-suitability'); ?>
        </p>
        <?php
    }

    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <form method="post" action="options.php">
                <?php
                settings_fields('culturata_bs_settings');
                do_settings_sections('culturata-brand-suitability');
                submit_button();
                ?>
            </form>

            <hr>

            <h2><?php _e('About Brand Suitability Scoring', 'culturata-brand-suitability'); ?></h2>
            <p><?php _e('Brand suitability analysis helps you understand how safe your content is for brand advertising.', 'culturata-brand-suitability'); ?></p>

            <h3><?php _e('GARM Risk Levels', 'culturata-brand-suitability'); ?></h3>
            <ul>
                <li><strong>Floor:</strong> <?php _e('No risk, completely brand safe', 'culturata-brand-suitability'); ?></li>
                <li><strong>Low:</strong> <?php _e('Minimal risk, safe for most brands', 'culturata-brand-suitability'); ?></li>
                <li><strong>Medium:</strong> <?php _e('Some risk, may not be suitable for all brands', 'culturata-brand-suitability'); ?></li>
                <li><strong>High:</strong> <?php _e('Significant risk, not suitable for most brands', 'culturata-brand-suitability'); ?></li>
            </ul>
        </div>
        <?php
    }

    public function render_bulk_analysis_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Bulk Analysis', 'culturata-brand-suitability'); ?></h1>
            <p><?php _e('Analyze multiple posts at once.', 'culturata-brand-suitability'); ?></p>

            <div id="culturata-bulk-analysis-app"></div>
        </div>
        <?php
    }

    public function enqueue_admin_scripts($hook) {
        // Only load on our plugin pages
        if (strpos($hook, 'culturata') === false && $hook !== 'post.php' && $hook !== 'post-new.php') {
            return;
        }

        wp_enqueue_style(
            'culturata-bs-admin',
            CULTURATA_BS_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            CULTURATA_BS_VERSION
        );

        wp_enqueue_script(
            'culturata-bs-admin',
            CULTURATA_BS_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            CULTURATA_BS_VERSION,
            true
        );

        wp_localize_script('culturata-bs-admin', 'culturataBsData', array(
            'apiUrl' => rest_url('culturata-bs/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
            'strings' => array(
                'analyzing' => __('Analyzing...', 'culturata-brand-suitability'),
                'error' => __('Error analyzing content', 'culturata-brand-suitability'),
                'success' => __('Analysis complete', 'culturata-brand-suitability')
            )
        ));
    }

    public function add_meta_boxes() {
        add_meta_box(
            'culturata-bs-analysis',
            __('Brand Suitability Score', 'culturata-brand-suitability'),
            array($this, 'render_meta_box'),
            array('post', 'page'),
            'side',
            'high'
        );
    }

    public function render_meta_box($post) {
        $analysis = Culturata_BS_Post_Meta::get_analysis($post->ID);
        $analyzed_at = Culturata_BS_Post_Meta::get_analyzed_at($post->ID);

        if ($analysis && isset($analysis['overallScore'])) {
            $summary = Culturata_BS_Post_Meta::get_score_summary($analysis['overallScore']);
            ?>
            <div class="culturata-bs-score-display" style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; font-weight: bold; color: <?php echo esc_attr($summary['color']); ?>">
                    <?php echo esc_html($analysis['overallScore']); ?>
                </div>
                <div style="font-size: 18px; margin: 10px 0;">
                    <?php echo esc_html($summary['label']); ?>
                </div>
                <div style="font-size: 14px; color: #666;">
                    GARM: <?php echo esc_html(strtoupper($analysis['garmRiskLevel'])); ?>
                </div>
                <?php if ($analyzed_at): ?>
                    <div style="font-size: 12px; color: #999; margin-top: 10px;">
                        <?php printf(__('Analyzed: %s', 'culturata-brand-suitability'), esc_html($analyzed_at)); ?>
                    </div>
                <?php endif; ?>

                <?php if (!empty($analysis['riskFlags'])): ?>
                    <div style="margin-top: 15px; text-align: left;">
                        <strong><?php _e('Risk Flags:', 'culturata-brand-suitability'); ?></strong>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                            <?php foreach ($analysis['riskFlags'] as $flag): ?>
                                <li><?php echo esc_html($flag['type']); ?> (<?php echo esc_html($flag['severity']); ?>)</li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
            </div>
            <button type="button" class="button button-secondary" style="width: 100%;" onclick="culturataBsReanalyze(<?php echo $post->ID; ?>)">
                <?php _e('Re-analyze', 'culturata-brand-suitability'); ?>
            </button>
            <?php
        } else {
            ?>
            <div style="text-align: center; padding: 20px;">
                <p><?php _e('No analysis available yet.', 'culturata-brand-suitability'); ?></p>
                <button type="button" class="button button-primary" style="width: 100%;" onclick="culturataBsAnalyze(<?php echo $post->ID; ?>)">
                    <?php _e('Analyze Now', 'culturata-brand-suitability'); ?>
                </button>
            </div>
            <?php
        }
    }
}
