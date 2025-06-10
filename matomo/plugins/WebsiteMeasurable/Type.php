<?php

/**
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

namespace Piwik\Plugins\WebsiteMeasurable;

class Type extends \Piwik\Measurable\Type
{
    public const ID = 'website';
    protected $name = 'Referrers_ColumnWebsite'; // we will use new key of WebsiteType_ once we have them
    protected $namePlural = 'SitesManager_Sites'; // translated into more languages
    protected $description = 'WebsiteMeasurable_WebsiteDescription';
    protected $howToSetupUrl = '?module=CoreAdminHome&action=trackingCodeGenerator';
}
