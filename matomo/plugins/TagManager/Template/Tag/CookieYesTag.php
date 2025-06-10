<?php

/**
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

namespace Piwik\Plugins\TagManager\Template\Tag;

use Piwik\Piwik;
use Piwik\Settings\FieldConfig;
use Piwik\Validators\NotEmpty;

class CookieYesTag extends BaseTag
{
    public function getDescription()
    {
        // By default, the description will be automatically fetched from the TagManager_CustomHtmlTagDescription
        // translation key. you can either adjust/create/remove this translation key, or return a different value
        // here directly.
        return Piwik::translate('TagManager_CookieYesTagDescription');
    }

    public function getCategory()
    {
        return Piwik::translate('TagManager_ConsentManagement');
    }

    public function getIcon()
    {
        // You may optionally specify a path to an image icon URL, for example:
        //
        // return 'plugins/TagManager/images/MyIcon.png';
        //
        // to not return default icon call:
        // return parent::getIcon();
        //
        // The image should have ideally a resolution of about 64x64 pixels.
        return 'plugins/TagManager/images/icons/cookieyes.svg';
    }

    public function getParameters()
    {
        return array(
            $this->makeSetting('cookieYesWebsiteKey', '', FieldConfig::TYPE_STRING, function (FieldConfig $field) {
                $field->title = Piwik::translate('TagManager_CookieYesTagWebsiteKeyTitle');
                $field->inlineHelp = Piwik::translate(
                    'TagManager_CookieYesTagWebsiteKeyDescription',
                    ['<strong>', '</strong>']
                );
                $field->customFieldComponent = self::FIELD_VARIABLE_COMPONENT;
                $field->validators[] = new NotEmpty();
            }),
        );
    }
}
