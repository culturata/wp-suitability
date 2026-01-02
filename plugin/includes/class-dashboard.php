<?php
/**
 * Dashboard widgets
 */

if (!defined('ABSPATH')) {
    exit;
}

class Culturata_BS_Dashboard {

    public function __construct() {
        add_action('wp_dashboard_setup', array($this, 'add_dashboard_widgets'));
    }

    public function add_dashboard_widgets() {
        wp_add_dashboard_widget(
            'culturata_bs_dashboard_widget',
            __('Brand Suitability Overview', 'culturata-brand-suitability'),
            array($this, 'render_dashboard_widget')
        );
    }

    public function render_dashboard_widget() {
        global $wpdb;

        // Get posts with analysis
        $analyzed_posts = $wpdb->get_var(
            "SELECT COUNT(DISTINCT post_id)
             FROM {$wpdb->postmeta}
             WHERE meta_key = '_culturata_bs_score'"
        );

        // Get average score
        $avg_score = $wpdb->get_var(
            "SELECT AVG(CAST(meta_value AS DECIMAL(5,2)))
             FROM {$wpdb->postmeta}
             WHERE meta_key = '_culturata_bs_score'"
        );

        // Get distribution by GARM level
        $garm_distribution = $wpdb->get_results(
            "SELECT meta_value as level, COUNT(*) as count
             FROM {$wpdb->postmeta}
             WHERE meta_key = '_culturata_bs_garm_level'
             GROUP BY meta_value",
            OBJECT
        );

        // Get recent high-risk posts
        $high_risk_posts = $wpdb->get_results(
            "SELECT p.ID, p.post_title, pm.meta_value as score
             FROM {$wpdb->posts} p
             INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
             WHERE pm.meta_key = '_culturata_bs_score'
             AND CAST(pm.meta_value AS DECIMAL(5,2)) < 60
             AND p.post_status = 'publish'
             ORDER BY pm.meta_value ASC
             LIMIT 5"
        );

        ?>
        <div class="culturata-bs-dashboard">
            <div class="culturata-bs-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="text-align: center; padding: 15px; background: #f0f0f1; border-radius: 4px;">
                    <div style="font-size: 32px; font-weight: bold; color: #1d4ed8;">
                        <?php echo esc_html($analyzed_posts); ?>
                    </div>
                    <div style="font-size: 14px; color: #666;">
                        <?php _e('Posts Analyzed', 'culturata-brand-suitability'); ?>
                    </div>
                </div>
                <div style="text-align: center; padding: 15px; background: #f0f0f1; border-radius: 4px;">
                    <div style="font-size: 32px; font-weight: bold; color: #10b981;">
                        <?php echo esc_html(number_format($avg_score, 1)); ?>
                    </div>
                    <div style="font-size: 14px; color: #666;">
                        <?php _e('Average Score', 'culturata-brand-suitability'); ?>
                    </div>
                </div>
            </div>

            <?php if (!empty($garm_distribution)): ?>
                <div style="margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0;"><?php _e('GARM Risk Distribution', 'culturata-brand-suitability'); ?></h4>
                    <div style="display: grid; gap: 8px;">
                        <?php foreach ($garm_distribution as $item):
                            $color_map = array(
                                'floor' => '#10b981',
                                'low' => '#3b82f6',
                                'medium' => '#f59e0b',
                                'high' => '#ef4444'
                            );
                            $color = isset($color_map[$item->level]) ? $color_map[$item->level] : '#999';
                            ?>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="flex: 1; background: #f0f0f1; border-radius: 4px; padding: 8px; display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 12px; height: 12px; border-radius: 50%; background: <?php echo esc_attr($color); ?>;"></div>
                                    <span style="flex: 1; text-transform: uppercase; font-weight: 600; font-size: 12px;">
                                        <?php echo esc_html($item->level); ?>
                                    </span>
                                    <span style="font-weight: bold;">
                                        <?php echo esc_html($item->count); ?>
                                    </span>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (!empty($high_risk_posts)): ?>
                <div>
                    <h4 style="margin: 0 0 10px 0; color: #ef4444;">
                        <?php _e('⚠ Posts Needing Attention', 'culturata-brand-suitability'); ?>
                    </h4>
                    <ul style="margin: 0; padding: 0; list-style: none;">
                        <?php foreach ($high_risk_posts as $post): ?>
                            <li style="margin-bottom: 8px; padding: 8px; background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 2px;">
                                <a href="<?php echo get_edit_post_link($post->ID); ?>" style="text-decoration: none; display: flex; justify-content: space-between; align-items: center;">
                                    <span><?php echo esc_html($post->post_title); ?></span>
                                    <span style="font-weight: bold; color: #ef4444;">
                                        <?php echo esc_html(number_format($post->score, 0)); ?>
                                    </span>
                                </a>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>

            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center;">
                <a href="<?php echo admin_url('admin.php?page=culturata-bulk-analysis'); ?>" class="button button-primary">
                    <?php _e('Bulk Analyze Posts', 'culturata-brand-suitability'); ?>
                </a>
                <a href="<?php echo admin_url('admin.php?page=culturata-brand-suitability'); ?>" class="button">
                    <?php _e('Settings', 'culturata-brand-suitability'); ?>
                </a>
            </div>
        </div>
        <?php
    }
}
