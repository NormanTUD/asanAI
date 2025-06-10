<?php

/**
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

namespace Piwik\Plugins\MultiSites;

use Exception;
use Piwik\API\Request;
use Piwik\Archive;
use Piwik\Common;
use Piwik\Container\StaticContainer;
use Piwik\DataTable;
use Piwik\DataTable\DataTableInterface;
use Piwik\DataTable\Row;
use Piwik\Period;
use Piwik\Period\Range;
use Piwik\Piwik;
use Piwik\Plugins\CoreHome\Columns\Metrics\EvolutionMetric;
use Piwik\Plugins\Goals\Archiver;
use Piwik\Plugins\MultiSites\Columns\Metrics\EcommerceOnlyEvolutionMetric;
use Piwik\Plugins\SitesManager\API as APISitesManager;
use Piwik\Scheduler\Scheduler;
use Piwik\SettingsPiwik;
use Piwik\Site;

/**
 * The MultiSites API lets you request the key metrics (visits, page views, revenue) for all Websites in Matomo.
 * @method static \Piwik\Plugins\MultiSites\API getInstance()
 */
class API extends \Piwik\Plugin\API
{
    public const METRIC_TRANSLATION_KEY = 'translation';
    public const METRIC_EVOLUTION_COL_NAME_KEY = 'evolution_column_name';
    public const METRIC_RECORD_NAME_KEY = 'record_name';
    public const METRIC_COL_NAME_KEY = 'metric_column_name';
    public const METRIC_IS_ECOMMERCE_KEY = 'is_ecommerce';

    public const NB_VISITS_METRIC = 'nb_visits';
    public const NB_ACTIONS_METRIC = 'nb_actions';
    public const NB_HITS_LABEL = 'hits';
    public const NB_HITS_METRIC = 'Actions_hits';
    public const NB_PAGEVIEWS_LABEL = 'nb_pageviews';
    public const NB_PAGEVIEWS_METRIC = 'Actions_nb_pageviews';
    public const GOAL_REVENUE_METRIC = 'revenue';
    public const GOAL_CONVERSION_METRIC = 'nb_conversions';
    public const ECOMMERCE_ORDERS_METRIC = 'orders';
    public const ECOMMERCE_REVENUE_METRIC = 'ecommerce_revenue';

    /** @var array<string,array<string,string>> */
    private static $baseMetrics = [
        self::NB_VISITS_METRIC   => [
            self::METRIC_TRANSLATION_KEY        => 'General_ColumnNbVisits',
            self::METRIC_EVOLUTION_COL_NAME_KEY => 'visits_evolution',
            self::METRIC_RECORD_NAME_KEY        => self::NB_VISITS_METRIC,
            self::METRIC_COL_NAME_KEY           => self::NB_VISITS_METRIC,
            self::METRIC_IS_ECOMMERCE_KEY       => false,
        ],
        self::NB_ACTIONS_METRIC  => [
            self::METRIC_TRANSLATION_KEY        => 'General_ColumnNbActions',
            self::METRIC_EVOLUTION_COL_NAME_KEY => 'actions_evolution',
            self::METRIC_RECORD_NAME_KEY        => self::NB_ACTIONS_METRIC,
            self::METRIC_COL_NAME_KEY           => self::NB_ACTIONS_METRIC,
            self::METRIC_IS_ECOMMERCE_KEY       => false,
        ]
    ];

    protected $autoSanitizeInputParams = false;

    /**
     * Returns a report displaying the total visits, actions and revenue, as
     * well as the evolution of these values, of all existing sites over a
     * specified period of time.
     *
     * If the specified period is not a 'range', this function will calculate
     * evolution metrics. Evolution metrics are metrics that display the
     * percent increase/decrease of another metric since the last period.
     *
     * This function will merge the result of the archive query so each
     * row in the result DataTable will correspond to the metrics of a single
     * site. If a date range is specified, the result will be a
     * DataTable\Map, but it will still be merged.
     *
     * @param string $period The period type to get data for.
     * @param string $date The date(s) to get data for.
     * @param null|string $segment The segments to get data for.
     * @param null|string $_restrictSitesToLogin Hack used to enforce we restrict the returned data to the specified username
     *                                        Only used when a scheduled task is running
     * @param bool $enhanced When true, return additional goal & ecommerce metrics
     * @param null|string $pattern If specified, only the website which names (or site ID) match the pattern will be returned using SitesManager.getPatternMatchSites
     * @param string|array<string> $showColumns If specified, only the requested columns will be fetched
     * @return DataTableInterface
     */
    public function getAll(
        string $period,
        string $date,
        ?string $segment = null,
        ?string $_restrictSitesToLogin = null,
        bool $enhanced = false,
        ?string $pattern = null,
        $showColumns = []
    ): DataTableInterface {
        Piwik::checkUserHasSomeViewAccess();

        $idSites = $this->getSitesIdFromPattern($pattern, $_restrictSitesToLogin);

        /**
         * This event can be used to manipulate the sites being displayed on all websites dashboard.
         *
         * **Example**
         *
         *     Piwik::addAction('MultiSites.filterSites', function (&$idSites) {
         *         $idSites = array_filter($idSites, function($idSite) {
         *             return $idSite !== 1
         *         });
         *     });
         *
         * @param array<int> &$idSites List of idSites that the current user would be allowed to see in all websites dashboard.
         */
        Piwik::postEvent('MultiSites.filterSites', [&$idSites]);

        if (!empty($showColumns) && is_string($showColumns)) {
            $showColumns = explode(',', $showColumns);
        }

        if (!is_array($showColumns)) {
            $showColumns = [];
        }

        if (empty($idSites)) {
            return new DataTable();
        }

        return $this->buildDataTable(
            $idSites,
            $period,
            $date,
            $segment,
            $_restrictSitesToLogin,
            $enhanced,
            $multipleWebsitesRequested = true,
            $showColumns
        );
    }

    /**
     * Fetches the list of sites which names match the string pattern
     *
     * @param ?string $pattern
     * @param ?string $_restrictSitesToLogin
     * @return array<int>
     */
    private function getSitesIdFromPattern(?string $pattern, ?string $_restrictSitesToLogin): array
    {
        if (empty($pattern)) {
            /** @var Scheduler $scheduler */
            $scheduler = StaticContainer::getContainer()->get('Piwik\Scheduler\Scheduler');
            // Then, warm the cache with only the data we should have access to
            if (
                Piwik::hasUserSuperUserAccess()
                // Hack: when this API function is called as a Scheduled Task, Super User status is enforced.
                // This means this function would return ALL websites in all cases.
                // Instead, we make sure that only the right set of data is returned
                && !$scheduler->isRunningTask()
            ) {
                $sites = APISitesManager::getInstance()->getAllSites();
            } else {
                $sites = APISitesManager::getInstance()->getSitesWithAtLeastViewAccess($limit = false, $_restrictSitesToLogin);
            }
        } else {
            /** @var array $sites */
            $sites = Request::processRequest(
                'SitesManager.getPatternMatchSites',
                [
                    'pattern' => $pattern,
                    'limit'   => SettingsPiwik::getWebsitesCountToDisplay(),
                    'format'  => 'original'
                ],
                []
            );

            if (!empty($sites)) {
                // cache sites for later usage
                Site::setSitesFromArray($sites);
            }
        }

        return array_column($sites, 'idsite');
    }

    /**
     * Same as getAll but for a unique Matomo site
     * @see \Piwik\Plugins\MultiSites\API::getAll()
     *
     * @param int $idSite Id of the Matomo site
     * @param string $period The period type to get data for.
     * @param string $date The date(s) to get data for.
     * @param null|string $segment The segments to get data for.
     * @param null|string $_restrictSitesToLogin Hack used to enforce we restrict the returned data to the specified username
     *                                        Only used when a scheduled task is running
     * @param bool $enhanced When true, return additional goal & ecommerce metrics
     * @return DataTableInterface
     */
    public function getOne(
        int $idSite,
        string $period,
        string $date,
        ?string $segment = null,
        ?string $_restrictSitesToLogin = null,
        bool $enhanced = false
    ): DataTableInterface {
        Piwik::checkUserHasViewAccess($idSite);

        $site = APISitesManager::getInstance()->getSiteFromId($idSite);

        if (empty($site)) {
            return new DataTable();
        }

        return $this->buildDataTable(
            [$idSite],
            $period,
            $date,
            $segment,
            $_restrictSitesToLogin,
            $enhanced,
            $multipleWebsitesRequested = false,
            $showColumns = []
        );
    }

    /**
     * @param null|string  $period
     * @param null|string  $date
     * @param null|string $segment
     * @param string       $pattern
     * @param int          $filter_limit
     * @return array<string,mixed>
     * @throws Exception
     */
    public function getAllWithGroups(
        ?string $period = null,
        ?string $date = null,
        ?string $segment = null,
        string $pattern = '',
        int $filter_limit = 0
    ): array {
        Piwik::checkUserHasSomeViewAccess();

        if (Period::isMultiplePeriod($date, $period)) {
            throw new Exception('Multiple periods are not supported');
        }

        $segment = $segment ?: false;
        $request = $_GET + $_POST;

        $dashboard = new Dashboard($period, $date, $segment);

        if ($pattern !== '') {
            $dashboard->search(strtolower($pattern));
        }

        $response = [
            'numSites' => $dashboard->getNumSites(),
            'totals'   => $dashboard->getTotals(),
            'lastDate' => $dashboard->getLastDate(),
            'sites'    => $dashboard->getSites($request, $filter_limit)
        ];

        return $response;
    }

    private function buildDataTable(
        array $idSites,
        string $period,
        string $date,
        ?string $segment,
        ?string $_restrictSitesToLogin,
        bool $enhanced,
        bool $multipleWebsitesRequested,
        ?array $showColumns
    ): DataTableInterface {
        $archive = Archive::build(
            $idSites,
            $period,
            $date,
            $segment,
            $_restrictSitesToLogin
        );

        // determine what data will be displayed
        $fieldsToGet = [];
        $columnNameRewrites = [];
        $apiECommerceMetrics = [];
        $apiMetrics = API::getApiMetrics($enhanced);
        foreach ($apiMetrics as $metricName => $metricSettings) {
            if (!empty($showColumns) && !in_array($metricName, $showColumns)) {
                unset($apiMetrics[$metricName]);
                continue;
            }
            $fieldsToGet[] = $metricSettings[self::METRIC_RECORD_NAME_KEY];
            $columnNameRewrites[$metricSettings[self::METRIC_RECORD_NAME_KEY]] = $metricName;

            if ($metricSettings[self::METRIC_IS_ECOMMERCE_KEY]) {
                $apiECommerceMetrics[$metricName] = $metricSettings;
            }
        }

        /** @var DataTable|DataTable\Map $dataTable */
        $dataTable = $archive->getDataTableFromNumericAndMergeChildren($fieldsToGet);

        $this->populateLabel($dataTable);

        // replace record names with user friendly metric names
        $dataTable->filter('ReplaceColumnNames', [$columnNameRewrites]);

        $totalMetrics = $this->preformatApiMetricsForTotalsCalculation($apiMetrics);
        $this->setMetricsTotalsMetadata($dataTable, $totalMetrics);

        // if the period isn't a range & a lastN/previousN date isn't used, we get the same
        // data for the last period to show the evolution of visits/actions/revenue
        [$strLastDate, $lastPeriod] = Range::getLastDate($date, $period);

        if ($strLastDate !== false) {
            if ($lastPeriod !== false) {
                // NOTE: no easy way to set last period date metadata when range of dates is requested.
                //       will be easier if DataTable\Map::metadata is removed, and metadata that is
                //       put there is put directly in DataTable::metadata.
                $dataTable->setMetadata(self::getLastPeriodMetadataName('date'), $lastPeriod);
            }

            $pastArchive = Archive::build($idSites, $period, $strLastDate, $segment, $_restrictSitesToLogin);
            $pastData = $pastArchive->getDataTableFromNumericAndMergeChildren($fieldsToGet);
            $pastData->filter('ReplaceColumnNames', [$columnNameRewrites]);
            $this->populateLabel($pastData); // labels are needed to calculate evolution
            $this->calculateEvolutionPercentages($dataTable, $pastData, $apiMetrics);
            $this->setPreviousMetricsTotalsMetadata($dataTable, $pastData, $totalMetrics);

            if ($dataTable instanceof DataTable) {
                // needed for MultiSites\Dashboard
                $dataTable->setMetadata('pastData', $pastData);
            }
        }

        // move the site id to a metadata column
        $dataTable->queueFilter('MetadataCallbackAddMetadata', [
            'idsite', 'group', function ($idSite) {
                if ($idSite == '-1') { // Others row might occur when `filter_truncate` API parameter is used
                    return '';
                }
                return Site::getGroupFor($idSite);
            }, []
        ]);
        $dataTable->queueFilter('MetadataCallbackAddMetadata', [
            'idsite', 'main_url', function ($idSite) {
                if ($idSite == '-1') { // Others row might occur when `filter_truncate` API parameter is used
                    return '';
                }
                return Site::getMainUrlFor($idSite);
            }, []
        ]);

        // set the label of each row to the site name
        if ($multipleWebsitesRequested) {
            $dataTable->queueFilter('ColumnCallbackReplace', [
                'label', function ($idSite) {
                    if ($idSite == '-1') { // Others row might occur when `filter_truncate` API parameter is used
                        return Piwik::translate('General_Others');
                    }
                    return Site::getNameFor($idSite);
                }
            ]);
        } else {
            $dataTable->queueFilter('ColumnDelete', ['label']);
        }

        // filter rows without visits
        // note: if only one website is queried and there are no visits, we can not remove the row otherwise
        // ResponseBuilder throws 'Call to a member function getColumns() on a non-object'
        if (
            $multipleWebsitesRequested
            // We don't delete the 0 visits row, if "Enhanced" mode is on.
            && !$enhanced && (empty($showColumns) || in_array(self::NB_VISITS_METRIC, $showColumns))
        ) {
            $dataTable->filter(
                'ColumnCallbackDeleteRow',
                [
                    self::NB_VISITS_METRIC,
                    function ($value) {
                        return $value == 0;
                    }
                ]
            );
        }

        // Remove unnecessary row metadata already been used by any filters that needed them
        $dataTable->queueFilter(function ($dataTable) {
            $dataTable->deleteRowsMetadata(DataTable::ARCHIVED_DATE_METADATA_NAME);
            $dataTable->deleteRowsMetadata(DataTable::ARCHIVE_STATE_METADATA_NAME);
            $dataTable->deleteColumn('_metadata');
        });

        if ($multipleWebsitesRequested && $dataTable->getRowsCount() === 1 && $dataTable instanceof DataTable\Simple) {
            $simpleTable = $dataTable;
            $dataTable   = $simpleTable->getEmptyClone();
            $dataTable->addRow($simpleTable->getFirstRow());
            unset($simpleTable);
        }

        return $dataTable;
    }

    /**
     * Performs a binary filter of two
     * DataTables in order to correctly calculate evolution metrics.
     *
     * @param DataTable|DataTable\Map $currentData
     * @param DataTable|DataTable\Map $pastData
     * @param array<string,array<string,string>> $apiMetrics The array of string fields to calculate evolution metrics for.
     * @throws Exception
     */
    private function calculateEvolutionPercentages(
        DataTableInterface $currentData,
        DataTableInterface $pastData,
        array $apiMetrics
    ): void {
        if (get_class($currentData) != get_class($pastData)) { // sanity check for regressions
            throw new Exception(sprintf(
                'Expected $pastData to be of type %1$s - got %2$s.',
                get_class($currentData),
                get_class($pastData)
            ));
        }

        if ($currentData instanceof DataTable\Map) {
            $pastArray = $pastData->getDataTables();
            foreach ($currentData->getDataTables() as $subTable) {
                $this->calculateEvolutionPercentages($subTable, current($pastArray), $apiMetrics);
                next($pastArray);
            }
        } else {
            $extraProcessedMetrics = $currentData->getMetadata(DataTable::EXTRA_PROCESSED_METRICS_METADATA_NAME);
            foreach ($apiMetrics as $metricSettings) {
                $evolutionMetricClass = $this->isEcommerceEvolutionMetric($metricSettings)
                    ? EcommerceOnlyEvolutionMetric::class
                    : EvolutionMetric::class;

                $extraProcessedMetrics = is_array($extraProcessedMetrics) ? $extraProcessedMetrics : [];
                $extraProcessedMetrics[] = new $evolutionMetricClass(
                    $metricSettings[self::METRIC_COL_NAME_KEY],
                    $pastData,
                    $metricSettings[self::METRIC_EVOLUTION_COL_NAME_KEY],
                    $quotientPrecision = 1,
                    $currentData
                );
            }
            $currentData->setMetadata(DataTable::EXTRA_PROCESSED_METRICS_METADATA_NAME, $extraProcessedMetrics);
        }
    }

    /**
     * @ignore
     */
    public static function getApiMetrics(bool $enhanced): array
    {
        $metrics = self::$baseMetrics;

        if (Common::isActionsPluginEnabled()) {
            $metrics[self::NB_PAGEVIEWS_LABEL] = [
                self::METRIC_TRANSLATION_KEY        => 'General_ColumnPageviews',
                self::METRIC_EVOLUTION_COL_NAME_KEY => 'pageviews_evolution',
                self::METRIC_RECORD_NAME_KEY        => self::NB_PAGEVIEWS_METRIC,
                self::METRIC_COL_NAME_KEY           => self::NB_PAGEVIEWS_LABEL,
                self::METRIC_IS_ECOMMERCE_KEY       => false,
            ];
            $metrics[self::NB_HITS_LABEL] = [
                self::METRIC_TRANSLATION_KEY        => 'General_ColumnHits',
                self::METRIC_EVOLUTION_COL_NAME_KEY => 'hits_evolution',
                self::METRIC_RECORD_NAME_KEY        => self::NB_HITS_METRIC,
                self::METRIC_COL_NAME_KEY           => self::NB_HITS_LABEL,
                self::METRIC_IS_ECOMMERCE_KEY       => false,
            ];
        }

        if (Common::isGoalPluginEnabled()) {
            // goal revenue metric
            $metrics[self::GOAL_REVENUE_METRIC] = [
                self::METRIC_TRANSLATION_KEY        => 'General_ColumnRevenue',
                self::METRIC_EVOLUTION_COL_NAME_KEY => self::GOAL_REVENUE_METRIC . '_evolution',
                self::METRIC_RECORD_NAME_KEY        => Archiver::getRecordName(self::GOAL_REVENUE_METRIC),
                self::METRIC_COL_NAME_KEY           => self::GOAL_REVENUE_METRIC,
                self::METRIC_IS_ECOMMERCE_KEY       => false,
            ];

            if ($enhanced) {
                // number of goal conversions metric
                $metrics[self::GOAL_CONVERSION_METRIC] = [
                    self::METRIC_TRANSLATION_KEY        => 'Goals_ColumnConversions',
                    self::METRIC_EVOLUTION_COL_NAME_KEY => self::GOAL_CONVERSION_METRIC . '_evolution',
                    self::METRIC_RECORD_NAME_KEY        => Archiver::getRecordName(self::GOAL_CONVERSION_METRIC),
                    self::METRIC_COL_NAME_KEY           => self::GOAL_CONVERSION_METRIC,
                    self::METRIC_IS_ECOMMERCE_KEY       => false,
                ];

                // number of orders
                $metrics[self::ECOMMERCE_ORDERS_METRIC] = [
                    self::METRIC_TRANSLATION_KEY        => 'General_EcommerceOrders',
                    self::METRIC_EVOLUTION_COL_NAME_KEY => self::ECOMMERCE_ORDERS_METRIC . '_evolution',
                    self::METRIC_RECORD_NAME_KEY        => Archiver::getRecordName(self::GOAL_CONVERSION_METRIC, 0),
                    self::METRIC_COL_NAME_KEY           => self::ECOMMERCE_ORDERS_METRIC,
                    self::METRIC_IS_ECOMMERCE_KEY       => true,
                ];

                // eCommerce revenue
                $metrics[self::ECOMMERCE_REVENUE_METRIC] = [
                    self::METRIC_TRANSLATION_KEY        => 'General_ProductRevenue',
                    self::METRIC_EVOLUTION_COL_NAME_KEY => self::ECOMMERCE_REVENUE_METRIC . '_evolution',
                    self::METRIC_RECORD_NAME_KEY        => Archiver::getRecordName(self::GOAL_REVENUE_METRIC, 0),
                    self::METRIC_COL_NAME_KEY           => self::ECOMMERCE_REVENUE_METRIC,
                    self::METRIC_IS_ECOMMERCE_KEY       => true,
                ];
            }
        }

        return $metrics;
    }

    private function preformatApiMetricsForTotalsCalculation(array $apiMetrics): array
    {
        $metrics = [];
        foreach ($apiMetrics as $label => $metricsInfo) {
            $totalMetadataName = self::getTotalMetadataName($label);
            $metrics[$totalMetadataName] = $metricsInfo[self::METRIC_COL_NAME_KEY];
        }

        return $metrics;
    }

    /**
     * Sets the total visits, actions & revenue for a DataTable returned by
     * $this->buildDataTable.
     *
     * @param DataTableInterface $dataTable
     * @param array<string,string> $apiMetrics Metrics info.
     */
    private function setMetricsTotalsMetadata(DataTableInterface $dataTable, array $apiMetrics): void
    {
        $dataTable->filter(function (DataTable $dataTable) use ($apiMetrics) {
            $totals = [];
            foreach ($apiMetrics as $label => $recordName) {
                $totals[$label] = 0;
            }

            $rows = $dataTable->getRows();

            $rows = $this->filterRowsForTotalsCalculation($rows);

            foreach ($rows as $row) {
                foreach ($apiMetrics as $totalMetadataName => $recordName) {
                    $totals[$totalMetadataName] += $row->getColumn($recordName);
                }
            }

            $dataTable->setMetadataValues($totals);
        });
    }

    /**
     * Sets the previous total visits, actions & revenue for a DataTable returned by
     * $this->buildDataTable.
     *
     * @param DataTable|DataTable\Map $dataTable
     * @param DataTable|DataTable\Map $pastData
     * @param array<string,string> $apiMetrics Metrics info.
     */
    private function setPreviousMetricsTotalsMetadata(
        DataTableInterface $dataTable,
        DataTableInterface $pastData,
        array $apiMetrics
    ): void {
        if ($dataTable instanceof DataTable\Map) {
            $currentDataTables = $dataTable->getDataTables();
            $pastDataTables = $pastData->getDataTables();
            $currentLabels = array_keys($currentDataTables);
            $pastLabels = array_keys($pastDataTables);

            foreach ($currentLabels as $index => $label) {
                $this->setPreviousMetricsTotalsMetadata(
                    $currentDataTables[$label],
                    $pastDataTables[$pastLabels[$index]],
                    $apiMetrics
                );
            }
        } else {
            $totals = [];
            foreach ($apiMetrics as $label => $recordName) {
                $label = 'previous_' . $label;

                $totals[$label] = 0;
            }

            $rows = $pastData->getRows();

            $rows = $this->filterRowsForTotalsCalculation($rows);

            foreach ($rows as $row) {
                foreach ($apiMetrics as $totalMetadataName => $recordName) {
                    $totalMetadataName = 'previous_' . $totalMetadataName;
                    $totals[$totalMetadataName] += $row->getColumn($recordName);
                }
            }

            $dataTable->setMetadataValues($totals);
        }
    }

    /**
     * @param Row[] $rows
     * @return Row[]
     */
    private function filterRowsForTotalsCalculation(array $rows): array
    {
        /**
         * Triggered to filter / restrict which rows should be included in the MultiSites (All Websites Dashboard)
         * totals calculation
         *
         * **Example**
         *
         *     public function filterMultiSitesRows(&$rows)
         *     {
         *         foreach ($rows as $index => $row) {
         *             if ($row->getColumn('label') === 5) {
         *                 unset($rows[$index]); // remove idSite 5 from totals
         *             }
         *         }
         *     }
         *
         * @param Row[] &$rows An array containing rows, one row for each site. The label columns equals the idSite.
         */
        Piwik::postEvent('MultiSites.filterRowsForTotalsCalculation', [&$rows]);

        return $rows;
    }

    private static function getTotalMetadataName(string $name): string
    {
        return 'total_' . $name;
    }

    private static function getLastPeriodMetadataName(string $name): string
    {
        return 'last_period_' . $name;
    }

    private function populateLabel(DataTableInterface $dataTable): void
    {
        // ensure label column is set and always the first column
        $dataTable->filter(function (DataTable $table) {
            foreach ($table->getRowsWithoutSummaryRow() as $row) {
                $row->setColumn('label', $row->getMetadata('idsite'));
                $row->setColumns(array_merge(['label' => $row->getColumn('label')], $row->getColumns()));
            }
        });
    }

    private function isEcommerceEvolutionMetric(array $metricSettings): bool
    {
        return in_array($metricSettings[self::METRIC_EVOLUTION_COL_NAME_KEY], [
            self::GOAL_REVENUE_METRIC . '_evolution',
            self::ECOMMERCE_ORDERS_METRIC . '_evolution',
            self::ECOMMERCE_REVENUE_METRIC . '_evolution'
        ]);
    }
}
