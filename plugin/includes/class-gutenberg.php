<?php
/**
 * Gutenberg integration for brand suitability
 */

if (!defined('ABSPATH')) {
    exit;
}

class Culturata_BS_Gutenberg {

    public function __construct() {
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_block_editor_assets'));
    }

    public function enqueue_block_editor_assets() {
        wp_enqueue_script(
            'culturata-bs-gutenberg',
            CULTURATA_BS_PLUGIN_URL . 'assets/js/gutenberg.js',
            array('wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'wp-data', 'wp-plugins', 'wp-edit-post', 'wp-i18n'),
            CULTURATA_BS_VERSION,
            true
        );

        wp_enqueue_style(
            'culturata-bs-gutenberg',
            CULTURATA_BS_PLUGIN_URL . 'assets/css/gutenberg.css',
            array('wp-edit-blocks'),
            CULTURATA_BS_VERSION
        );

        wp_localize_script('culturata-bs-gutenberg', 'culturataBsGutenberg', array(
            'apiUrl' => rest_url('culturata-bs/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
            'postId' => get_the_ID()
        ));
    }
}
