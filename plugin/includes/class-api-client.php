<?php
/**
 * API Client for Culturata Brand Suitability API
 */

if (!defined('ABSPATH')) {
    exit;
}

class Culturata_BS_API_Client {

    private $api_endpoint;
    private $api_key;

    public function __construct() {
        $settings = get_option('culturata_bs_settings', array());
        $this->api_endpoint = isset($settings['api_endpoint']) ? $settings['api_endpoint'] : 'https://api.culturata.com/v1';
        $this->api_key = isset($settings['api_key']) ? $settings['api_key'] : '';
    }

    /**
     * Analyze content
     */
    public function analyze_content($title, $content, $excerpt = '', $post_id = null, $post_url = null) {
        if (empty($this->api_key)) {
            return new WP_Error('no_api_key', __('API key not configured', 'culturata-brand-suitability'));
        }

        $body = array(
            'title' => sanitize_text_field($title),
            'content' => wp_kses_post($content),
            'excerpt' => sanitize_text_field($excerpt)
        );

        if ($post_id) {
            $body['postId'] = $post_id;
        }

        if ($post_url) {
            $body['postUrl'] = esc_url($post_url);
        }

        $response = wp_remote_post(
            $this->api_endpoint . '/analyze',
            array(
                'headers' => array(
                    'Content-Type' => 'application/json',
                    'X-API-Key' => $this->api_key
                ),
                'body' => json_encode($body),
                'timeout' => 30
            )
        );

        if (is_wp_error($response)) {
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($status_code === 429) {
            // Rate limit exceeded
            return new WP_Error(
                'rate_limit_exceeded',
                isset($data['error']) ? $data['error'] : __('Rate limit exceeded', 'culturata-brand-suitability'),
                array('data' => $data)
            );
        }

        if ($status_code !== 200) {
            return new WP_Error(
                'api_error',
                isset($data['error']) ? $data['error'] : __('API request failed', 'culturata-brand-suitability'),
                array('status' => $status_code)
            );
        }

        if (!isset($data['success']) || !$data['success']) {
            return new WP_Error('api_error', __('Invalid API response', 'culturata-brand-suitability'));
        }

        return $data['data'];
    }

    /**
     * Get user profile and usage information
     */
    public function get_user_profile() {
        if (empty($this->api_key)) {
            return new WP_Error('no_api_key', __('API key not configured', 'culturata-brand-suitability'));
        }

        $response = wp_remote_get(
            $this->api_endpoint . '/user/profile',
            array(
                'headers' => array(
                    'X-API-Key' => $this->api_key
                ),
                'timeout' => 15
            )
        );

        if (is_wp_error($response)) {
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($status_code !== 200) {
            return new WP_Error('api_error', __('Failed to fetch user profile', 'culturata-brand-suitability'));
        }

        return $data['data'];
    }

    /**
     * Get analysis by ID
     */
    public function get_analysis($analysis_id) {
        if (empty($this->api_key)) {
            return new WP_Error('no_api_key', __('API key not configured', 'culturata-brand-suitability'));
        }

        $response = wp_remote_get(
            $this->api_endpoint . '/analyze/' . $analysis_id,
            array(
                'headers' => array(
                    'X-API-Key' => $this->api_key
                ),
                'timeout' => 15
            )
        );

        if (is_wp_error($response)) {
            return $response;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        return isset($data['data']) ? $data['data'] : null;
    }

    /**
     * Test API connection
     */
    public function test_connection() {
        $profile = $this->get_user_profile();
        return !is_wp_error($profile);
    }
}
