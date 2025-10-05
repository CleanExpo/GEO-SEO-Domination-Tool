<?php
/**
 * Plugin Name: GEO-SEO Connector
 * Plugin URI: https://github.com/yourusername/geo-seo-connector
 * Description: Connects your WordPress site to GEO-SEO Domination Tool for automatic SEO optimization. Allows the CRM to safely modify SEO meta tags, images, and content to improve rankings.
 * Version: 1.0.0
 * Author: GEO-SEO Team
 * Author URI: https://geo-seo-tool.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: geo-seo-connector
 * Requires at least: 5.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Define plugin constants
define('GEO_SEO_VERSION', '1.0.0');
define('GEO_SEO_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('GEO_SEO_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Main GEO_SEO_Connector class
 */
class GEO_SEO_Connector {

    /**
     * Plugin instance
     */
    private static $instance = null;

    /**
     * API key for authentication
     */
    private $api_key;

    /**
     * Allowed CRM domains
     */
    private $allowed_domains;

    /**
     * Get plugin instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->api_key = get_option('geo_seo_api_key', '');
        $this->allowed_domains = get_option('geo_seo_allowed_domains', ['geo-seo-domination-tool.vercel.app']);

        // Initialize plugin
        add_action('init', [$this, 'init']);
        add_action('rest_api_init', [$this, 'register_endpoints']);
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);

        // Activation/deactivation hooks
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
    }

    /**
     * Initialize plugin
     */
    public function init() {
        // Load text domain for translations
        load_plugin_textdomain('geo-seo-connector', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Generate API key if not exists
        if (empty($this->api_key)) {
            $this->api_key = $this->generate_api_key();
            update_option('geo_seo_api_key', $this->api_key);
        }

        // Create database tables if needed
        $this->create_tables();

        // Set default options
        if (!get_option('geo_seo_allowed_domains')) {
            update_option('geo_seo_allowed_domains', ['geo-seo-domination-tool.vercel.app']);
        }

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Create database tables
     */
    private function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        // Table for change backups
        $table_name = $wpdb->prefix . 'geo_seo_backups';

        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            post_id bigint(20) NOT NULL,
            change_type varchar(50) NOT NULL,
            field_name varchar(100) NOT NULL,
            original_value longtext,
            new_value longtext,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            rollback_expires_at datetime,
            can_rollback tinyint(1) DEFAULT 1,
            PRIMARY KEY (id),
            KEY post_id (post_id),
            KEY created_at (created_at)
        ) $charset_collate;";

        // Table for change logs
        $table_name_log = $wpdb->prefix . 'geo_seo_change_log';

        $sql_log = "CREATE TABLE IF NOT EXISTS $table_name_log (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            post_id bigint(20) NOT NULL,
            action varchar(50) NOT NULL,
            fields_updated text,
            user_ip varchar(45),
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY post_id (post_id),
            KEY created_at (created_at)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        dbDelta($sql_log);
    }

    /**
     * Generate secure API key
     */
    private function generate_api_key() {
        return 'gsk_' . bin2hex(random_bytes(32));
    }

    /**
     * Register REST API endpoints
     */
    public function register_endpoints() {
        // Verify connection endpoint
        register_rest_route('geo-seo/v1', '/verify', [
            'methods' => 'GET',
            'callback' => [$this, 'verify_connection'],
            'permission_callback' => [$this, 'check_api_key']
        ]);

        // Get WordPress info
        register_rest_route('geo-seo/v1', '/info', [
            'methods' => 'GET',
            'callback' => [$this, 'get_site_info'],
            'permission_callback' => [$this, 'check_api_key']
        ]);

        // Get post metadata
        register_rest_route('geo-seo/v1', '/post/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_post_meta'],
            'permission_callback' => [$this, 'check_api_key']
        ]);

        // Update post metadata
        register_rest_route('geo-seo/v1', '/post/(?P<id>\d+)', [
            'methods' => 'POST',
            'callback' => [$this, 'update_post_meta'],
            'permission_callback' => [$this, 'check_api_key']
        ]);

        // Get all posts needing SEO
        register_rest_route('geo-seo/v1', '/posts/needs-seo', [
            'methods' => 'GET',
            'callback' => [$this, 'get_posts_needing_seo'],
            'permission_callback' => [$this, 'check_api_key']
        ]);

        // Update image alt text
        register_rest_route('geo-seo/v1', '/media/(?P<id>\d+)/alt', [
            'methods' => 'POST',
            'callback' => [$this, 'update_image_alt'],
            'permission_callback' => [$this, 'check_api_key']
        ]);

        // Get change history
        register_rest_route('geo-seo/v1', '/history', [
            'methods' => 'GET',
            'callback' => [$this, 'get_change_history'],
            'permission_callback' => [$this, 'check_api_key']
        ]);

        // Rollback change
        register_rest_route('geo-seo/v1', '/rollback/(?P<id>\d+)', [
            'methods' => 'POST',
            'callback' => [$this, 'rollback_change'],
            'permission_callback' => [$this, 'check_api_key']
        ]);
    }

    /**
     * Verify API key
     */
    public function check_api_key($request) {
        $auth_header = $request->get_header('Authorization');

        if (!$auth_header) {
            return new WP_Error('no_auth', __('No authorization header', 'geo-seo-connector'), ['status' => 401]);
        }

        // Extract API key from "Bearer {key}" format
        $api_key = str_replace('Bearer ', '', $auth_header);

        if ($api_key !== $this->api_key) {
            // Log failed attempt
            $this->log_access_attempt($api_key, false);
            return new WP_Error('invalid_key', __('Invalid API key', 'geo-seo-connector'), ['status' => 403]);
        }

        // Log successful access
        $this->log_access_attempt($api_key, true);

        return true;
    }

    /**
     * Verify connection endpoint
     */
    public function verify_connection($request) {
        global $wp_version;

        return [
            'success' => true,
            'message' => __('Connection verified', 'geo-seo-connector'),
            'plugin_version' => GEO_SEO_VERSION,
            'wordpress_version' => $wp_version,
            'site_url' => get_site_url(),
        ];
    }

    /**
     * Get site information
     */
    public function get_site_info($request) {
        global $wp_version;

        // Detect active SEO plugin
        $seo_plugin = 'none';
        if (defined('WPSEO_VERSION')) {
            $seo_plugin = 'yoast';
        } elseif (class_exists('RankMath')) {
            $seo_plugin = 'rank_math';
        } elseif (defined('AIOSEOP_VERSION')) {
            $seo_plugin = 'all_in_one';
        }

        return [
            'site_name' => get_bloginfo('name'),
            'site_url' => get_site_url(),
            'wordpress_version' => $wp_version,
            'plugin_version' => GEO_SEO_VERSION,
            'active_seo_plugin' => $seo_plugin,
            'php_version' => PHP_VERSION,
            'can_edit_posts' => true,
            'can_edit_pages' => true,
            'can_edit_images' => true,
        ];
    }

    /**
     * Get post metadata
     */
    public function get_post_meta($request) {
        $post_id = $request['id'];
        $post = get_post($post_id);

        if (!$post) {
            return new WP_Error('not_found', __('Post not found', 'geo-seo-connector'), ['status' => 404]);
        }

        // Get Yoast SEO meta (if installed)
        $yoast_title = get_post_meta($post_id, '_yoast_wpseo_title', true);
        $yoast_desc = get_post_meta($post_id, '_yoast_wpseo_metadesc', true);
        $yoast_focus_keyword = get_post_meta($post_id, '_yoast_wpseo_focuskw', true);

        // Get Rank Math meta (if installed)
        $rank_math_title = get_post_meta($post_id, 'rank_math_title', true);
        $rank_math_desc = get_post_meta($post_id, 'rank_math_description', true);

        // Get All in One SEO meta (if installed)
        $aioseo_title = get_post_meta($post_id, '_aioseo_title', true);
        $aioseo_desc = get_post_meta($post_id, '_aioseo_description', true);

        return [
            'id' => $post_id,
            'title' => $post->post_title,
            'content' => $post->post_content,
            'excerpt' => $post->post_excerpt,
            'slug' => $post->post_name,
            'status' => $post->post_status,
            'type' => $post->post_type,
            'seo' => [
                'yoast_title' => $yoast_title,
                'yoast_description' => $yoast_desc,
                'yoast_focus_keyword' => $yoast_focus_keyword,
                'rank_math_title' => $rank_math_title,
                'rank_math_description' => $rank_math_desc,
                'aioseo_title' => $aioseo_title,
                'aioseo_description' => $aioseo_desc,
            ],
            'featured_image_id' => get_post_thumbnail_id($post_id),
            'url' => get_permalink($post_id),
            'modified' => $post->post_modified,
        ];
    }

    /**
     * Update post metadata
     */
    public function update_post_meta($request) {
        $post_id = $request['id'];
        $changes = $request->get_json_params();

        if (!$changes || !is_array($changes)) {
            return new WP_Error('invalid_data', __('Invalid data provided', 'geo-seo-connector'), ['status' => 400]);
        }

        $post = get_post($post_id);
        if (!$post) {
            return new WP_Error('not_found', __('Post not found', 'geo-seo-connector'), ['status' => 404]);
        }

        $updated = [];

        // Create backups before changing
        foreach ($changes as $key => $value) {
            $this->create_backup($post_id, $key, $value);
        }

        // Update Yoast SEO meta
        if (isset($changes['yoast_title'])) {
            update_post_meta($post_id, '_yoast_wpseo_title', sanitize_text_field($changes['yoast_title']));
            $updated[] = 'yoast_title';
        }

        if (isset($changes['yoast_description'])) {
            update_post_meta($post_id, '_yoast_wpseo_metadesc', sanitize_text_field($changes['yoast_description']));
            $updated[] = 'yoast_description';
        }

        if (isset($changes['yoast_focus_keyword'])) {
            update_post_meta($post_id, '_yoast_wpseo_focuskw', sanitize_text_field($changes['yoast_focus_keyword']));
            $updated[] = 'yoast_focus_keyword';
        }

        // Update Rank Math meta
        if (isset($changes['rank_math_title'])) {
            update_post_meta($post_id, 'rank_math_title', sanitize_text_field($changes['rank_math_title']));
            $updated[] = 'rank_math_title';
        }

        if (isset($changes['rank_math_description'])) {
            update_post_meta($post_id, 'rank_math_description', sanitize_text_field($changes['rank_math_description']));
            $updated[] = 'rank_math_description';
        }

        // Update All in One SEO meta
        if (isset($changes['aioseo_title'])) {
            update_post_meta($post_id, '_aioseo_title', sanitize_text_field($changes['aioseo_title']));
            $updated[] = 'aioseo_title';
        }

        if (isset($changes['aioseo_description'])) {
            update_post_meta($post_id, '_aioseo_description', sanitize_text_field($changes['aioseo_description']));
            $updated[] = 'aioseo_description';
        }

        // Update post title
        if (isset($changes['title'])) {
            wp_update_post([
                'ID' => $post_id,
                'post_title' => sanitize_text_field($changes['title'])
            ]);
            $updated[] = 'title';
        }

        // Update post content (use with caution)
        if (isset($changes['content'])) {
            wp_update_post([
                'ID' => $post_id,
                'post_content' => wp_kses_post($changes['content'])
            ]);
            $updated[] = 'content';
        }

        // Update excerpt
        if (isset($changes['excerpt'])) {
            wp_update_post([
                'ID' => $post_id,
                'post_excerpt' => sanitize_text_field($changes['excerpt'])
            ]);
            $updated[] = 'excerpt';
        }

        // Log the change
        $this->log_change($post_id, 'update_meta', $updated);

        return [
            'success' => true,
            'updated' => $updated,
            'message' => sprintf(__('%d fields updated successfully', 'geo-seo-connector'), count($updated))
        ];
    }

    /**
     * Get posts that need SEO optimization
     */
    public function get_posts_needing_seo($request) {
        $args = [
            'post_type' => ['post', 'page'],
            'post_status' => 'publish',
            'posts_per_page' => 100,
            'orderby' => 'modified',
            'order' => 'DESC',
        ];

        $posts = get_posts($args);
        $needs_seo = [];

        foreach ($posts as $post) {
            $score = $this->calculate_seo_score($post->ID);

            // Only include posts with score < 80
            if ($score < 80) {
                $needs_seo[] = [
                    'id' => $post->ID,
                    'title' => $post->post_title,
                    'url' => get_permalink($post->ID),
                    'seo_score' => $score,
                    'issues' => $this->get_seo_issues($post->ID),
                ];
            }
        }

        return $needs_seo;
    }

    /**
     * Calculate simple SEO score for a post
     */
    private function calculate_seo_score($post_id) {
        $score = 100;

        $post = get_post($post_id);

        // Check title length
        $title_length = strlen($post->post_title);
        if ($title_length > 60 || $title_length < 30) {
            $score -= 10;
        }

        // Check for meta description
        $yoast_desc = get_post_meta($post_id, '_yoast_wpseo_metadesc', true);
        $rank_math_desc = get_post_meta($post_id, 'rank_math_description', true);

        if (empty($yoast_desc) && empty($rank_math_desc)) {
            $score -= 20;
        }

        // Check for focus keyword
        $focus_keyword = get_post_meta($post_id, '_yoast_wpseo_focuskw', true);
        if (empty($focus_keyword)) {
            $score -= 15;
        }

        // Check for featured image
        if (!has_post_thumbnail($post_id)) {
            $score -= 10;
        }

        // Check content length
        $content_length = str_word_count(strip_tags($post->post_content));
        if ($content_length < 300) {
            $score -= 15;
        }

        return max(0, $score);
    }

    /**
     * Get SEO issues for a post
     */
    private function get_seo_issues($post_id) {
        $issues = [];

        $post = get_post($post_id);

        // Title issues
        $title_length = strlen($post->post_title);
        if ($title_length > 60) {
            $issues[] = [
                'type' => 'title_too_long',
                'severity' => 'medium',
                'message' => sprintf(__('Title is %d characters (recommended: 30-60)', 'geo-seo-connector'), $title_length)
            ];
        } elseif ($title_length < 30) {
            $issues[] = [
                'type' => 'title_too_short',
                'severity' => 'medium',
                'message' => sprintf(__('Title is %d characters (recommended: 30-60)', 'geo-seo-connector'), $title_length)
            ];
        }

        // Meta description issues
        $yoast_desc = get_post_meta($post_id, '_yoast_wpseo_metadesc', true);
        $rank_math_desc = get_post_meta($post_id, 'rank_math_description', true);

        if (empty($yoast_desc) && empty($rank_math_desc)) {
            $issues[] = [
                'type' => 'missing_meta_description',
                'severity' => 'high',
                'message' => __('Meta description is missing', 'geo-seo-connector')
            ];
        }

        // Content length
        $content_length = str_word_count(strip_tags($post->post_content));
        if ($content_length < 300) {
            $issues[] = [
                'type' => 'content_too_short',
                'severity' => 'high',
                'message' => sprintf(__('Content is %d words (recommended: 300+)', 'geo-seo-connector'), $content_length)
            ];
        }

        // Featured image
        if (!has_post_thumbnail($post_id)) {
            $issues[] = [
                'type' => 'missing_featured_image',
                'severity' => 'low',
                'message' => __('Featured image is missing', 'geo-seo-connector')
            ];
        }

        return $issues;
    }

    /**
     * Update image alt text
     */
    public function update_image_alt($request) {
        $image_id = $request['id'];
        $params = $request->get_json_params();
        $alt_text = $params['alt_text'] ?? '';

        if (empty($alt_text)) {
            return new WP_Error('missing_alt', __('Alt text is required', 'geo-seo-connector'), ['status' => 400]);
        }

        // Create backup
        $current_alt = get_post_meta($image_id, '_wp_attachment_image_alt', true);
        $this->create_backup($image_id, 'image_alt', $current_alt);

        // Update alt text
        update_post_meta($image_id, '_wp_attachment_image_alt', sanitize_text_field($alt_text));

        // Log change
        $this->log_change($image_id, 'update_image_alt', ['alt_text']);

        return [
            'success' => true,
            'message' => __('Image alt text updated', 'geo-seo-connector')
        ];
    }

    /**
     * Create backup before making changes
     */
    private function create_backup($post_id, $field_name, $new_value) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'geo_seo_backups';

        // Get current value
        $original_value = '';
        if (strpos($field_name, 'yoast_') === 0) {
            $meta_key = str_replace('yoast_', '_yoast_wpseo_', $field_name);
            $original_value = get_post_meta($post_id, $meta_key, true);
        } elseif (strpos($field_name, 'rank_math_') === 0) {
            $meta_key = str_replace('yoast_', '', $field_name);
            $original_value = get_post_meta($post_id, $meta_key, true);
        } elseif ($field_name === 'title') {
            $post = get_post($post_id);
            $original_value = $post->post_title;
        } elseif ($field_name === 'content') {
            $post = get_post($post_id);
            $original_value = $post->post_content;
        }

        // Calculate rollback expiration (90 days from now)
        $rollback_expires = date('Y-m-d H:i:s', strtotime('+90 days'));

        $wpdb->insert(
            $table_name,
            [
                'post_id' => $post_id,
                'change_type' => 'manual',
                'field_name' => $field_name,
                'original_value' => $original_value,
                'new_value' => $new_value,
                'rollback_expires_at' => $rollback_expires,
                'can_rollback' => 1,
            ],
            ['%d', '%s', '%s', '%s', '%s', '%s', '%d']
        );
    }

    /**
     * Log changes for audit trail
     */
    private function log_change($post_id, $action, $fields_updated) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'geo_seo_change_log';

        $user_ip = $this->get_client_ip();

        $wpdb->insert(
            $table_name,
            [
                'post_id' => $post_id,
                'action' => $action,
                'fields_updated' => json_encode($fields_updated),
                'user_ip' => $user_ip,
            ],
            ['%d', '%s', '%s', '%s']
        );
    }

    /**
     * Log access attempts
     */
    private function log_access_attempt($api_key, $success) {
        // In production, log to file or database
        // For now, just use error_log
        $status = $success ? 'SUCCESS' : 'FAILED';
        $ip = $this->get_client_ip();
        $masked_key = substr($api_key, 0, 10) . '...';

        error_log("[GEO-SEO] Auth attempt: $status - IP: $ip - Key: $masked_key");
    }

    /**
     * Get client IP address
     */
    private function get_client_ip() {
        $ip = '';

        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        }

        return sanitize_text_field($ip);
    }

    /**
     * Get change history
     */
    public function get_change_history($request) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'geo_seo_change_log';

        $limit = $request->get_param('limit') ?? 50;
        $offset = $request->get_param('offset') ?? 0;

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name ORDER BY created_at DESC LIMIT %d OFFSET %d",
            $limit,
            $offset
        ));

        return $results;
    }

    /**
     * Rollback a change
     */
    public function rollback_change($request) {
        global $wpdb;

        $backup_id = $request['id'];
        $table_name = $wpdb->prefix . 'geo_seo_backups';

        // Get backup record
        $backup = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE id = %d AND can_rollback = 1",
            $backup_id
        ));

        if (!$backup) {
            return new WP_Error('not_found', __('Backup not found or cannot be rolled back', 'geo-seo-connector'), ['status' => 404]);
        }

        // Check if rollback has expired
        if (strtotime($backup->rollback_expires_at) < time()) {
            return new WP_Error('expired', __('Rollback period has expired', 'geo-seo-connector'), ['status' => 400]);
        }

        // Restore original value
        $field_name = $backup->field_name;
        $post_id = $backup->post_id;
        $original_value = $backup->original_value;

        if (strpos($field_name, 'yoast_') === 0) {
            $meta_key = str_replace('yoast_', '_yoast_wpseo_', $field_name);
            update_post_meta($post_id, $meta_key, $original_value);
        } elseif (strpos($field_name, 'rank_math_') === 0) {
            $meta_key = str_replace('yoast_', '', $field_name);
            update_post_meta($post_id, $meta_key, $original_value);
        } elseif ($field_name === 'title') {
            wp_update_post(['ID' => $post_id, 'post_title' => $original_value]);
        } elseif ($field_name === 'content') {
            wp_update_post(['ID' => $post_id, 'post_content' => $original_value]);
        }

        // Mark as rolled back
        $wpdb->update(
            $table_name,
            ['can_rollback' => 0],
            ['id' => $backup_id],
            ['%d'],
            ['%d']
        );

        // Log rollback
        $this->log_change($post_id, 'rollback', [$field_name]);

        return [
            'success' => true,
            'message' => __('Change rolled back successfully', 'geo-seo-connector')
        ];
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            __('GEO-SEO Connector', 'geo-seo-connector'),
            __('GEO-SEO', 'geo-seo-connector'),
            'manage_options',
            'geo-seo-connector',
            [$this, 'render_settings_page'],
            'dashicons-chart-area',
            100
        );
    }

    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'toplevel_page_geo-seo-connector') {
            return;
        }

        wp_enqueue_style(
            'geo-seo-admin',
            GEO_SEO_PLUGIN_URL . 'admin/css/admin.css',
            [],
            GEO_SEO_VERSION
        );

        wp_enqueue_script(
            'geo-seo-admin',
            GEO_SEO_PLUGIN_URL . 'admin/js/admin.js',
            ['jquery'],
            GEO_SEO_VERSION,
            true
        );
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        // Generate API key if not exists
        if (empty($this->api_key)) {
            $this->api_key = $this->generate_api_key();
            update_option('geo_seo_api_key', $this->api_key);
        }

        // Get recent changes
        global $wpdb;
        $table_name = $wpdb->prefix . 'geo_seo_change_log';
        $recent_changes = $wpdb->get_results("SELECT * FROM $table_name ORDER BY created_at DESC LIMIT 10");

        // Calculate stats
        $total_changes = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
        $monthly_changes = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_name WHERE created_at >= %s",
            date('Y-m-d', strtotime('-30 days'))
        ));

        // Include admin template
        include GEO_SEO_PLUGIN_DIR . 'admin/settings-page.php';
    }
}

// Initialize plugin
function geo_seo_connector_init() {
    return GEO_SEO_Connector::get_instance();
}

add_action('plugins_loaded', 'geo_seo_connector_init');
