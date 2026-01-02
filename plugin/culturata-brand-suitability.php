<?php
/**
 * Plugin Name: Culturata Brand Suitability
 * Plugin URI: https://culturata.com/brand-suitability
 * Description: Real-time brand suitability analysis for WordPress content powered by Culturata Labs
 * Version: 1.0.0
 * Author: Culturata Labs
 * Author URI: https://culturata.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: culturata-brand-suitability
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('CULTURATA_BS_VERSION', '1.0.0');
define('CULTURATA_BS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CULTURATA_BS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CULTURATA_BS_PLUGIN_FILE', __FILE__);

// Include required files
require_once CULTURATA_BS_PLUGIN_DIR . 'includes/class-api-client.php';
require_once CULTURATA_BS_PLUGIN_DIR . 'includes/class-post-meta.php';
require_once CULTURATA_BS_PLUGIN_DIR . 'includes/class-admin.php';
require_once CULTURATA_BS_PLUGIN_DIR . 'includes/class-gutenberg.php';
require_once CULTURATA_BS_PLUGIN_DIR . 'includes/class-dashboard.php';

/**
 * Main plugin class
 */
class Culturata_Brand_Suitability {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->init_hooks();
    }

    private function init_hooks() {
        // Initialize components
        add_action('plugins_loaded', array($this, 'load_textdomain'));
        add_action('admin_init', array($this, 'init_components'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));

        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }

    public function load_textdomain() {
        load_plugin_textdomain(
            'culturata-brand-suitability',
            false,
            dirname(plugin_basename(__FILE__)) . '/languages/'
        );
    }

    public function init_components() {
        // Initialize admin settings
        new Culturata_BS_Admin();

        // Initialize Gutenberg integration
        new Culturata_BS_Gutenberg();

        // Initialize dashboard widgets
        new Culturata_BS_Dashboard();
    }

    public function register_rest_routes() {
        register_rest_route('culturata-bs/v1', '/analyze', array(
            'methods' => 'POST',
            'callback' => array($this, 'rest_analyze_content'),
            'permission_callback' => function() {
                return current_user_can('edit_posts');
            }
        ));

        register_rest_route('culturata-bs/v1', '/analysis/(?P<post_id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'rest_get_analysis'),
            'permission_callback' => function() {
                return current_user_can('edit_posts');
            }
        ));
    }

    public function rest_analyze_content($request) {
        $title = $request->get_param('title');
        $content = $request->get_param('content');
        $excerpt = $request->get_param('excerpt');
        $post_id = $request->get_param('post_id');

        if (empty($title) || empty($content)) {
            return new WP_Error('missing_data', 'Title and content are required', array('status' => 400));
        }

        $api_client = new Culturata_BS_API_Client();
        $result = $api_client->analyze_content($title, $content, $excerpt, $post_id);

        if (is_wp_error($result)) {
            return $result;
        }

        // Save to post meta if post_id provided
        if ($post_id) {
            Culturata_BS_Post_Meta::save_analysis($post_id, $result);
        }

        return rest_ensure_response($result);
    }

    public function rest_get_analysis($request) {
        $post_id = $request->get_param('post_id');
        $analysis = Culturata_BS_Post_Meta::get_analysis($post_id);

        if (!$analysis) {
            return new WP_Error('not_found', 'No analysis found for this post', array('status' => 404));
        }

        return rest_ensure_response($analysis);
    }

    public function activate() {
        // Set default options
        $default_options = array(
            'api_key' => '',
            'api_endpoint' => 'https://api.culturata.com/v1',
            'auto_analyze' => false,
            'cache_duration' => 86400 // 24 hours
        );

        add_option('culturata_bs_settings', $default_options);

        // Create custom capability
        $role = get_role('administrator');
        if ($role) {
            $role->add_cap('manage_culturata_brand_suitability');
        }
    }

    public function deactivate() {
        // Cleanup if needed
    }
}

// Initialize plugin
function culturata_brand_suitability_init() {
    return Culturata_Brand_Suitability::get_instance();
}

add_action('plugins_loaded', 'culturata_brand_suitability_init');
