<?php
/**
 * Admin Settings Page Template
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

    <div class="notice notice-info">
        <p>
            <strong><?php _e('GEO-SEO Connector', 'geo-seo-connector'); ?></strong> -
            <?php _e('Connect your WordPress site to GEO-SEO Domination Tool for automatic SEO optimization.', 'geo-seo-connector'); ?>
        </p>
    </div>

    <div class="geo-seo-dashboard">
        <!-- Connection Status Card -->
        <div class="card">
            <h2><?php _e('Connection Status', 'geo-seo-connector'); ?></h2>

            <div class="connection-status">
                <span class="dashicons dashicons-yes-alt" style="color: #46b450; font-size: 24px;"></span>
                <p style="display: inline-block; margin-left: 10px;">
                    <strong><?php _e('Plugin Active', 'geo-seo-connector'); ?></strong><br>
                    <small><?php _e('Ready to receive connections from GEO-SEO CRM', 'geo-seo-connector'); ?></small>
                </p>
            </div>

            <p><strong><?php _e('Site URL:', 'geo-seo-connector'); ?></strong> <?php echo esc_url(get_site_url()); ?></p>
            <p><strong><?php _e('API Endpoint:', 'geo-seo-connector'); ?></strong>
                <code><?php echo esc_url(get_rest_url(null, 'geo-seo/v1')); ?></code>
            </p>
        </div>

        <!-- API Key Card -->
        <div class="card">
            <h2><?php _e('API Key', 'geo-seo-connector'); ?></h2>

            <div class="api-key-section">
                <input
                    type="text"
                    id="geo-seo-api-key"
                    readonly
                    value="<?php echo esc_attr($this->api_key); ?>"
                    style="width: 100%; font-family: monospace; font-size: 14px; padding: 10px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px;"
                    onclick="this.select();"
                >
                <br><br>
                <button
                    type="button"
                    class="button button-secondary"
                    onclick="copyApiKey()"
                >
                    <span class="dashicons dashicons-clipboard"></span>
                    <?php _e('Copy API Key', 'geo-seo-connector'); ?>
                </button>

                <button
                    type="button"
                    class="button button-secondary"
                    onclick="regenerateApiKey()"
                    style="margin-left: 10px;"
                >
                    <span class="dashicons dashicons-update"></span>
                    <?php _e('Regenerate Key', 'geo-seo-connector'); ?>
                </button>
            </div>

            <p class="description">
                <?php _e('Copy this API key and paste it into your GEO-SEO CRM dashboard to connect this site.', 'geo-seo-connector'); ?>
            </p>
        </div>

        <!-- Setup Instructions Card -->
        <div class="card">
            <h2><?php _e('Setup Instructions', 'geo-seo-connector'); ?></h2>

            <ol style="line-height: 1.8;">
                <li><?php _e('Copy the API key above', 'geo-seo-connector'); ?></li>
                <li><?php _e('Go to your GEO-SEO CRM dashboard', 'geo-seo-connector'); ?></li>
                <li><?php _e('Navigate to Settings → WordPress Connections', 'geo-seo-connector'); ?></li>
                <li><?php _e('Click "Add WordPress Site"', 'geo-seo-connector'); ?></li>
                <li>
                    <?php _e('Enter:', 'geo-seo-connector'); ?>
                    <ul style="margin-top: 5px;">
                        <li><strong><?php _e('Site URL:', 'geo-seo-connector'); ?></strong> <?php echo esc_url(get_site_url()); ?></li>
                        <li><strong><?php _e('API Key:', 'geo-seo-connector'); ?></strong> <?php _e('(paste from above)', 'geo-seo-connector'); ?></li>
                    </ul>
                </li>
                <li><?php _e('Click "Test Connection" to verify', 'geo-seo-connector'); ?></li>
                <li><?php _e('Start optimizing your site automatically!', 'geo-seo-connector'); ?></li>
            </ol>
        </div>

        <!-- Recent Changes Card -->
        <div class="card">
            <h2><?php _e('Recent Changes', 'geo-seo-connector'); ?> (<?php _e('Last 10', 'geo-seo-connector'); ?>)</h2>

            <?php if (empty($recent_changes)): ?>
                <p><?php _e('No changes have been made yet.', 'geo-seo-connector'); ?></p>
            <?php else: ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th><?php _e('Date', 'geo-seo-connector'); ?></th>
                            <th><?php _e('Post/Page', 'geo-seo-connector'); ?></th>
                            <th><?php _e('Action', 'geo-seo-connector'); ?></th>
                            <th><?php _e('Fields Updated', 'geo-seo-connector'); ?></th>
                            <th><?php _e('Source', 'geo-seo-connector'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recent_changes as $change): ?>
                        <tr>
                            <td><?php echo esc_html(date('Y-m-d H:i', strtotime($change->created_at))); ?></td>
                            <td>
                                <?php
                                $post = get_post($change->post_id);
                                if ($post) {
                                    echo '<a href="' . get_edit_post_link($change->post_id) . '" target="_blank">' . esc_html($post->post_title) . '</a>';
                                } else {
                                    echo 'ID: ' . esc_html($change->post_id);
                                }
                                ?>
                            </td>
                            <td><?php echo esc_html($change->action); ?></td>
                            <td>
                                <?php
                                $fields = json_decode($change->fields_updated);
                                echo esc_html(is_array($fields) ? implode(', ', $fields) : $change->fields_updated);
                                ?>
                            </td>
                            <td>
                                <span class="dashicons dashicons-cloud" title="GEO-SEO CRM"></span>
                                <?php echo esc_html($change->user_ip); ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <!-- Statistics Card -->
        <div class="card">
            <h2><?php _e('Statistics', 'geo-seo-connector'); ?></h2>

            <div class="geo-seo-stats">
                <div class="stat-box">
                    <span class="stat-number"><?php echo esc_html($total_changes); ?></span>
                    <span class="stat-label"><?php _e('Total Changes Made', 'geo-seo-connector'); ?></span>
                </div>

                <div class="stat-box">
                    <span class="stat-number"><?php echo esc_html($monthly_changes); ?></span>
                    <span class="stat-label"><?php _e('Changes This Month', 'geo-seo-connector'); ?></span>
                </div>

                <div class="stat-box">
                    <span class="stat-number"><?php echo defined('WPSEO_VERSION') ? 'Yoast' : (class_exists('RankMath') ? 'Rank Math' : 'None'); ?></span>
                    <span class="stat-label"><?php _e('Active SEO Plugin', 'geo-seo-connector'); ?></span>
                </div>
            </div>
        </div>

        <!-- Security & Safety Card -->
        <div class="card">
            <h2><?php _e('Security & Safety', 'geo-seo-connector'); ?></h2>

            <ul style="line-height: 1.8;">
                <li>
                    <span class="dashicons dashicons-shield" style="color: #46b450;"></span>
                    <strong><?php _e('Automatic Backups:', 'geo-seo-connector'); ?></strong>
                    <?php _e('Every change is backed up before being applied', 'geo-seo-connector'); ?>
                </li>
                <li>
                    <span class="dashicons dashicons-shield" style="color: #46b450;"></span>
                    <strong><?php _e('90-Day Rollback:', 'geo-seo-connector'); ?></strong>
                    <?php _e('You can revert any change within 90 days', 'geo-seo-connector'); ?>
                </li>
                <li>
                    <span class="dashicons dashicons-shield" style="color: #46b450;"></span>
                    <strong><?php _e('Audit Trail:', 'geo-seo-connector'); ?></strong>
                    <?php _e('All changes are logged with timestamp and source IP', 'geo-seo-connector'); ?>
                </li>
                <li>
                    <span class="dashicons dashicons-shield" style="color: #46b450;"></span>
                    <strong><?php _e('API Authentication:', 'geo-seo-connector'); ?></strong>
                    <?php _e('Only requests with valid API key are accepted', 'geo-seo-connector'); ?>
                </li>
                <li>
                    <span class="dashicons dashicons-shield" style="color: #46b450;"></span>
                    <strong><?php _e('Content Sanitization:', 'geo-seo-connector'); ?></strong>
                    <?php _e('All changes are sanitized to prevent XSS attacks', 'geo-seo-connector'); ?>
                </li>
            </ul>
        </div>

        <!-- Help Card -->
        <div class="card">
            <h2><?php _e('Need Help?', 'geo-seo-connector'); ?></h2>

            <p><?php _e('If you encounter any issues or have questions:', 'geo-seo-connector'); ?></p>

            <ul>
                <li>
                    <a href="https://github.com/yourusername/geo-seo-connector/wiki" target="_blank">
                        <?php _e('Documentation & Guides', 'geo-seo-connector'); ?>
                    </a>
                </li>
                <li>
                    <a href="https://github.com/yourusername/geo-seo-connector/issues" target="_blank">
                        <?php _e('Report a Bug', 'geo-seo-connector'); ?>
                    </a>
                </li>
                <li>
                    <a href="mailto:support@geo-seo-tool.com">
                        <?php _e('Contact Support', 'geo-seo-connector'); ?>
                    </a>
                </li>
            </ul>
        </div>
    </div>
</div>

<script>
function copyApiKey() {
    const input = document.getElementById('geo-seo-api-key');
    input.select();
    document.execCommand('copy');

    alert('<?php _e('API key copied to clipboard!', 'geo-seo-connector'); ?>');
}

function regenerateApiKey() {
    if (!confirm('<?php _e('Are you sure you want to regenerate the API key? This will break the connection to your CRM until you update the key there.', 'geo-seo-connector'); ?>')) {
        return;
    }

    // In production, make AJAX call to regenerate key
    alert('<?php _e('This feature will be implemented in the next version.', 'geo-seo-connector'); ?>');
}
</script>

<style>
.geo-seo-dashboard .card {
    max-width: 900px;
    margin-bottom: 20px;
    padding: 20px;
}

.connection-status {
    margin: 20px 0;
    padding: 15px;
    background: #f0f9ff;
    border-left: 4px solid #46b450;
}

.api-key-section {
    margin: 15px 0;
}

.geo-seo-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.stat-box {
    background: #f7f7f7;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    border: 1px solid #ddd;
}

.stat-number {
    display: block;
    font-size: 32px;
    font-weight: bold;
    color: #2271b1;
    margin-bottom: 8px;
}

.stat-label {
    display: block;
    font-size: 14px;
    color: #666;
}

.geo-seo-dashboard ul li {
    margin-bottom: 10px;
}
</style>
