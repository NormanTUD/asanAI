<?php

use Twig\Environment;
use Twig\Error\LoaderError;
use Twig\Error\RuntimeError;
use Twig\Extension\CoreExtension;
use Twig\Extension\SandboxExtension;
use Twig\Markup;
use Twig\Sandbox\SecurityError;
use Twig\Sandbox\SecurityNotAllowedTagError;
use Twig\Sandbox\SecurityNotAllowedFilterError;
use Twig\Sandbox\SecurityNotAllowedFunctionError;
use Twig\Source;
use Twig\Template;

/* @Installation/layout.twig */
class __TwigTemplate_dd7611d13e97e59843cbfa35b4aeb0d3 extends Template
{
    private $source;
    private $macros = [];

    public function __construct(Environment $env)
    {
        parent::__construct($env);

        $this->source = $this->getSourceContext();

        $this->parent = false;

        $this->blocks = [
            'content' => [$this, 'block_content'],
        ];
    }

    protected function doDisplay(array $context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 1
        yield "<!DOCTYPE html>
<html id=\"ng-app\">
<head>
    <meta charset=\"utf-8\">
    <meta name=\"robots\" content=\"noindex,nofollow\">
    <meta name=\"google\" content=\"notranslate\">
    <title>Matomo ";
        // line 7
        yield \Piwik\piwik_escape_filter($this->env, (isset($context["piwikVersion"]) || array_key_exists("piwikVersion", $context) ? $context["piwikVersion"] : (function () { throw new RuntimeError('Variable "piwikVersion" does not exist.', 7, $this->source); })()), "html", null, true);
        yield " &rsaquo; ";
        yield \Piwik\piwik_escape_filter($this->env, $this->env->getFilter('translate')->getCallable()("Installation_Installation"), "html", null, true);
        yield "</title>

    <script>window.piwik = {installation: true};</script>
    <link rel=\"stylesheet\" type=\"text/css\" href=\"index.php?module=Installation&action=getInstallationCss\"/>
    <script>
        ";
        // line 12
        yield (isset($context["javascriptTranslations"]) || array_key_exists("javascriptTranslations", $context) ? $context["javascriptTranslations"] : (function () { throw new RuntimeError('Variable "javascriptTranslations" does not exist.', 12, $this->source); })());
        yield "
    </script>
    <script type=\"text/javascript\" src=\"index.php?module=Installation&action=getInstallationJs\"></script>
    <link rel=\"shortcut icon\" href=\"plugins/CoreHome/images/favicon.png\"/>
</head>
<body id=\"installation\">
<div class=\"container\">

    <div class=\"header\">
        <div class=\"logo\">
            <img title=\"Matomo ";
        // line 22
        yield \Piwik\piwik_escape_filter($this->env, (isset($context["piwikVersion"]) || array_key_exists("piwikVersion", $context) ? $context["piwikVersion"] : (function () { throw new RuntimeError('Variable "piwikVersion" does not exist.', 22, $this->source); })()), "html", null, true);
        yield " - ";
        yield \Piwik\piwik_escape_filter($this->env, $this->env->getFilter('translate')->getCallable()("General_OpenSourceWebAnalytics"), "html_attr");
        yield "\" src=\"plugins/Morpheus/images/logo.png\"/>
            <p>";
        // line 23
        yield \Piwik\piwik_escape_filter($this->env, $this->env->getFilter('translate')->getCallable()("General_OpenSourceWebAnalytics"), "html", null, true);
        yield "</p>
        </div>
        <div class=\"language-selector\">
            ";
        // line 26
        yield $this->env->getFunction('postEvent')->getCallable()("Template.topBar");
        yield "
        </div>

        <div class=\"installation-progress\">
            <h4>
                ";
        // line 31
        yield \Piwik\piwik_escape_filter($this->env, $this->env->getFilter('translate')->getCallable()("Installation_InstallationStatus"), "html", null, true);
        yield "
                <small>";
        // line 32
        yield \Piwik\piwik_escape_filter($this->env, (isset($context["percentDone"]) || array_key_exists("percentDone", $context) ? $context["percentDone"] : (function () { throw new RuntimeError('Variable "percentDone" does not exist.', 32, $this->source); })()), "html", null, true);
        yield "%</small>
            </h4>
            <div class=\"progress\">
                <div class=\"progress-bar\" role=\"progressbar\" aria-valuenow=\"60\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: ";
        // line 35
        yield \Piwik\piwik_escape_filter($this->env, (isset($context["percentDone"]) || array_key_exists("percentDone", $context) ? $context["percentDone"] : (function () { throw new RuntimeError('Variable "percentDone" does not exist.', 35, $this->source); })()), "html", null, true);
        yield "%;\"></div>
            </div>
        </div>

        <div class=\"clearfix\"></div>
    </div>

    <div class=\"row\">
        <div class=\"col s3\">
            <ul class=\"list-group\">
                ";
        // line 45
        $context['_parent'] = $context;
        $context['_seq'] = CoreExtension::ensureTraversable((isset($context["allStepsTitle"]) || array_key_exists("allStepsTitle", $context) ? $context["allStepsTitle"] : (function () { throw new RuntimeError('Variable "allStepsTitle" does not exist.', 45, $this->source); })()));
        foreach ($context['_seq'] as $context["stepId"] => $context["stepName"]) {
            // line 46
            yield "                    ";
            if (((isset($context["currentStepId"]) || array_key_exists("currentStepId", $context) ? $context["currentStepId"] : (function () { throw new RuntimeError('Variable "currentStepId" does not exist.', 46, $this->source); })()) > $context["stepId"])) {
                // line 47
                yield "                        ";
                $context["stepClass"] = "disabled";
                // line 48
                yield "                    ";
            } elseif (((isset($context["currentStepId"]) || array_key_exists("currentStepId", $context) ? $context["currentStepId"] : (function () { throw new RuntimeError('Variable "currentStepId" does not exist.', 48, $this->source); })()) == $context["stepId"])) {
                // line 49
                yield "                        ";
                $context["stepClass"] = "active";
                // line 50
                yield "                    ";
            } else {
                // line 51
                yield "                        ";
                $context["stepClass"] = "";
                // line 52
                yield "                    ";
            }
            // line 53
            yield "                    <li class=\"list-group-item ";
            yield \Piwik\piwik_escape_filter($this->env, (isset($context["stepClass"]) || array_key_exists("stepClass", $context) ? $context["stepClass"] : (function () { throw new RuntimeError('Variable "stepClass" does not exist.', 53, $this->source); })()), "html", null, true);
            yield "\">";
            yield \Piwik\piwik_escape_filter($this->env, ($context["stepId"] + 1), "html", null, true);
            yield ". ";
            yield \Piwik\piwik_escape_filter($this->env, $this->env->getFilter('translate')->getCallable()($context["stepName"]), "html", null, true);
            yield "</li>
                ";
        }
        $_parent = $context['_parent'];
        unset($context['_seq'], $context['_iterated'], $context['stepId'], $context['stepName'], $context['_parent'], $context['loop']);
        $context = array_intersect_key($context, $_parent) + $_parent;
        // line 55
        yield "            </ul>
        </div>
        <div class=\"col s9 content\">
            ";
        // line 58
        $context["nextButton"] = ('' === $tmp = \Twig\Extension\CoreExtension::captureOutput((function () use (&$context, $macros, $blocks) {
            // line 59
            yield "                <p class=\"next-step\">
                    <a class=\"btn\" href=\"";
            // line 60
            yield \Piwik\piwik_escape_filter($this->env, $this->env->getFunction('linkTo')->getCallable()(["action" => (isset($context["nextModuleName"]) || array_key_exists("nextModuleName", $context) ? $context["nextModuleName"] : (function () { throw new RuntimeError('Variable "nextModuleName" does not exist.', 60, $this->source); })()), "token_auth" => null, "method" => null]), "html", null, true);
            yield "\">
                        ";
            // line 61
            yield \Piwik\piwik_escape_filter($this->env, $this->env->getFilter('translate')->getCallable()("General_Next"), "html", null, true);
            yield " &raquo;</a>
                </p>
            ";
            return; yield '';
        })())) ? '' : new Markup($tmp, $this->env->getCharset());
        // line 64
        yield "            ";
        if ((array_key_exists("showNextStepAtTop", $context) && (isset($context["showNextStepAtTop"]) || array_key_exists("showNextStepAtTop", $context) ? $context["showNextStepAtTop"] : (function () { throw new RuntimeError('Variable "showNextStepAtTop" does not exist.', 64, $this->source); })()))) {
            // line 65
            yield "                ";
            yield \Piwik\piwik_escape_filter($this->env, (isset($context["nextButton"]) || array_key_exists("nextButton", $context) ? $context["nextButton"] : (function () { throw new RuntimeError('Variable "nextButton" does not exist.', 65, $this->source); })()), "html", null, true);
            yield "
            ";
        }
        // line 67
        yield "
            ";
        // line 68
        yield from $this->unwrap()->yieldBlock('content', $context, $blocks);
        // line 69
        yield "
            ";
        // line 70
        if ((isset($context["showNextStep"]) || array_key_exists("showNextStep", $context) ? $context["showNextStep"] : (function () { throw new RuntimeError('Variable "showNextStep" does not exist.', 70, $this->source); })())) {
            // line 71
            yield "                ";
            yield \Piwik\piwik_escape_filter($this->env, (isset($context["nextButton"]) || array_key_exists("nextButton", $context) ? $context["nextButton"] : (function () { throw new RuntimeError('Variable "nextButton" does not exist.', 71, $this->source); })()), "html", null, true);
            yield "
            ";
        }
        // line 73
        yield "        </div>
    </div>

</div>

<div id=\"should-get-hidden\"
     style=\"color: red;margin-left: 16px;margin-bottom: 16px;font-weight:bold;font-size: 20px\">
    <p class=\"should-get-hidden-by-js\">
        ";
        // line 81
        yield \Piwik\piwik_escape_filter($this->env, $this->env->getFilter('translate')->getCallable()("CoreHome_JsDidntLoad"), "html", null, true);
        yield "
    </p>
    <p class=\"should-get-hidden-by-css\">
        ";
        // line 84
        yield \Piwik\piwik_escape_filter($this->env, $this->env->getFilter('translate')->getCallable()("CoreHome_CssDidntLoad"), "html", null, true);
        yield "
    </p>
</div>
";
        // line 87
        yield from         $this->loadTemplate("@CoreHome/_adblockDetect.twig", "@Installation/layout.twig", 87)->unwrap()->yield($context);
        // line 88
        yield "</body>
</html>
";
        return; yield '';
    }

    // line 68
    public function block_content($context, array $blocks = [])
    {
        $macros = $this->macros;
        return; yield '';
    }

    /**
     * @codeCoverageIgnore
     */
    public function getTemplateName()
    {
        return "@Installation/layout.twig";
    }

    /**
     * @codeCoverageIgnore
     */
    public function isTraitable()
    {
        return false;
    }

    /**
     * @codeCoverageIgnore
     */
    public function getDebugInfo()
    {
        return array (  228 => 68,  221 => 88,  219 => 87,  213 => 84,  207 => 81,  197 => 73,  191 => 71,  189 => 70,  186 => 69,  184 => 68,  181 => 67,  175 => 65,  172 => 64,  165 => 61,  161 => 60,  158 => 59,  156 => 58,  151 => 55,  138 => 53,  135 => 52,  132 => 51,  129 => 50,  126 => 49,  123 => 48,  120 => 47,  117 => 46,  113 => 45,  100 => 35,  94 => 32,  90 => 31,  82 => 26,  76 => 23,  70 => 22,  57 => 12,  47 => 7,  39 => 1,);
    }

    public function getSourceContext()
    {
        return new Source("<!DOCTYPE html>
<html id=\"ng-app\">
<head>
    <meta charset=\"utf-8\">
    <meta name=\"robots\" content=\"noindex,nofollow\">
    <meta name=\"google\" content=\"notranslate\">
    <title>Matomo {{ piwikVersion }} &rsaquo; {{ 'Installation_Installation'|translate }}</title>

    <script>window.piwik = {installation: true};</script>
    <link rel=\"stylesheet\" type=\"text/css\" href=\"index.php?module=Installation&action=getInstallationCss\"/>
    <script>
        {{ javascriptTranslations|raw }}
    </script>
    <script type=\"text/javascript\" src=\"index.php?module=Installation&action=getInstallationJs\"></script>
    <link rel=\"shortcut icon\" href=\"plugins/CoreHome/images/favicon.png\"/>
</head>
<body id=\"installation\">
<div class=\"container\">

    <div class=\"header\">
        <div class=\"logo\">
            <img title=\"Matomo {{ piwikVersion }} - {{ 'General_OpenSourceWebAnalytics'|translate|escape('html_attr') }}\" src=\"plugins/Morpheus/images/logo.png\"/>
            <p>{{ 'General_OpenSourceWebAnalytics'|translate }}</p>
        </div>
        <div class=\"language-selector\">
            {{ postEvent('Template.topBar')|raw }}
        </div>

        <div class=\"installation-progress\">
            <h4>
                {{ 'Installation_InstallationStatus'|translate }}
                <small>{{ percentDone }}%</small>
            </h4>
            <div class=\"progress\">
                <div class=\"progress-bar\" role=\"progressbar\" aria-valuenow=\"60\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: {{ percentDone }}%;\"></div>
            </div>
        </div>

        <div class=\"clearfix\"></div>
    </div>

    <div class=\"row\">
        <div class=\"col s3\">
            <ul class=\"list-group\">
                {% for stepId,stepName in allStepsTitle %}
                    {% if currentStepId > stepId %}
                        {% set stepClass = 'disabled' %}
                    {% elseif currentStepId == stepId %}
                        {% set stepClass = 'active' %}
                    {% else %}
                        {% set stepClass = '' %}
                    {% endif %}
                    <li class=\"list-group-item {{ stepClass }}\">{{ stepId + 1 }}. {{ stepName|translate }}</li>
                {% endfor %}
            </ul>
        </div>
        <div class=\"col s9 content\">
            {% set nextButton %}
                <p class=\"next-step\">
                    <a class=\"btn\" href=\"{{ linkTo({'action':nextModuleName, 'token_auth':null, 'method':null }) }}\">
                        {{ 'General_Next'|translate }} &raquo;</a>
                </p>
            {% endset %}
            {% if showNextStepAtTop is defined and showNextStepAtTop %}
                {{ nextButton }}
            {% endif %}

            {% block content %}{% endblock %}

            {% if showNextStep %}
                {{ nextButton }}
            {% endif %}
        </div>
    </div>

</div>

<div id=\"should-get-hidden\"
     style=\"color: red;margin-left: 16px;margin-bottom: 16px;font-weight:bold;font-size: 20px\">
    <p class=\"should-get-hidden-by-js\">
        {{ 'CoreHome_JsDidntLoad'|translate }}
    </p>
    <p class=\"should-get-hidden-by-css\">
        {{ 'CoreHome_CssDidntLoad'|translate }}
    </p>
</div>
{% include \"@CoreHome/_adblockDetect.twig\" %}
</body>
</html>
", "@Installation/layout.twig", "/home/norman/websites/TensorFlowJS-GUI/matomo/plugins/Installation/templates/layout.twig");
    }
}
