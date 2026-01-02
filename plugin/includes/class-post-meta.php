<?php
/**
 * Post meta management for brand suitability scores
 */

if (!defined('ABSPATH')) {
    exit;
}

class Culturata_BS_Post_Meta {

    const META_KEY = '_culturata_bs_analysis';
    const META_KEY_SCORE = '_culturata_bs_score';
    const META_KEY_GARM = '_culturata_bs_garm_level';
    const META_KEY_ANALYZED_AT = '_culturata_bs_analyzed_at';

    /**
     * Save analysis results to post meta
     */
    public static function save_analysis($post_id, $analysis_data) {
        if (!$post_id || !is_array($analysis_data)) {
            return false;
        }

        // Save full analysis data
        update_post_meta($post_id, self::META_KEY, $analysis_data);

        // Save individual searchable fields
        if (isset($analysis_data['overallScore'])) {
            update_post_meta($post_id, self::META_KEY_SCORE, $analysis_data['overallScore']);
        }

        if (isset($analysis_data['garmRiskLevel'])) {
            update_post_meta($post_id, self::META_KEY_GARM, $analysis_data['garmRiskLevel']);
        }

        update_post_meta($post_id, self::META_KEY_ANALYZED_AT, current_time('mysql'));

        return true;
    }

    /**
     * Get analysis results from post meta
     */
    public static function get_analysis($post_id) {
        if (!$post_id) {
            return null;
        }

        return get_post_meta($post_id, self::META_KEY, true);
    }

    /**
     * Get overall score
     */
    public static function get_score($post_id) {
        if (!$post_id) {
            return null;
        }

        return get_post_meta($post_id, self::META_KEY_SCORE, true);
    }

    /**
     * Get GARM risk level
     */
    public static function get_garm_level($post_id) {
        if (!$post_id) {
            return null;
        }

        return get_post_meta($post_id, self::META_KEY_GARM, true);
    }

    /**
     * Check if post has been analyzed
     */
    public static function has_analysis($post_id) {
        if (!$post_id) {
            return false;
        }

        $analysis = self::get_analysis($post_id);
        return !empty($analysis);
    }

    /**
     * Get last analyzed timestamp
     */
    public static function get_analyzed_at($post_id) {
        if (!$post_id) {
            return null;
        }

        return get_post_meta($post_id, self::META_KEY_ANALYZED_AT, true);
    }

    /**
     * Delete analysis data
     */
    public static function delete_analysis($post_id) {
        if (!$post_id) {
            return false;
        }

        delete_post_meta($post_id, self::META_KEY);
        delete_post_meta($post_id, self::META_KEY_SCORE);
        delete_post_meta($post_id, self::META_KEY_GARM);
        delete_post_meta($post_id, self::META_KEY_ANALYZED_AT);

        return true;
    }

    /**
     * Get score summary (color, label, etc.)
     */
    public static function get_score_summary($score) {
        if ($score >= 90) {
            return array(
                'grade' => 'A',
                'label' => __('Excellent', 'culturata-brand-suitability'),
                'color' => '#10b981',
                'icon' => '✓'
            );
        } elseif ($score >= 75) {
            return array(
                'grade' => 'B',
                'label' => __('Good', 'culturata-brand-suitability'),
                'color' => '#3b82f6',
                'icon' => '✓'
            );
        } elseif ($score >= 60) {
            return array(
                'grade' => 'C',
                'label' => __('Moderate', 'culturata-brand-suitability'),
                'color' => '#f59e0b',
                'icon' => '⚠'
            );
        } elseif ($score >= 40) {
            return array(
                'grade' => 'D',
                'label' => __('Risky', 'culturata-brand-suitability'),
                'color' => '#f97316',
                'icon' => '⚠'
            );
        } else {
            return array(
                'grade' => 'F',
                'label' => __('High Risk', 'culturata-brand-suitability'),
                'color' => '#ef4444',
                'icon' => '✕'
            );
        }
    }
}
