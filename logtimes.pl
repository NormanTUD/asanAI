#!/usr/bin/perl
use strict;
use warnings;
use POSIX qw/strftime/;
use Git::Repository;
use Text::CSV;
use DateTime;
use DateTime::Format::Strptime;
use Chart::Gnuplot;
use Calendar::Simple;
use Data::Dumper;

sub dier {
	die Dumper \@_;
}

# Set the Git repository path
my $repo_path = '.';

# Define the date range
my $start_date = shift || '2022-01-01';
my $end_date = shift || '2022-12-31';

my $start_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($start_date);
my $original_start_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($start_date);
my $end_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($end_date);

use Calendar::Simple;
use DateTime::Format::Strptime;
use Term::ANSIColor;

# Create a CSV object for writing timetable.csv
my $csv_timetable = Text::CSV->new({ binary => 1, eol => $/ });
open my $timetable_fh, '>', 'timetable.csv' or die "Could not open timetable.csv: $!";
$csv_timetable->print($timetable_fh, ['tag', 'uhrzeit_erster_commit', 'uhrzeit_letzter_commit']);

# Create a CSV object for writing table2.csv
my $csv_table2 = Text::CSV->new({ binary => 1, eol => $/ });
open my $table2_fh, '>', 'table2.csv' or die "Could not open table2.csv: $!";
$csv_table2->print($table2_fh, ['tag', 'arbeitszeit', 'anzahl_commits_an_dem_tag', 'erster_commit', 'letzter_commit']);

# Initialize total working hours and commits count
my $total_working_hours = 0;
my $total_commits_count = 0;

# Initialize Gnuplot data arrays
my @plot_dates;
my @plot_commits;

my %global_working_hours = ();

# Iterate through each day in the date range
while ($start_time <= $end_time) {
	my $current_date = $start_time->strftime('%Y-%m-%d');
	my $strp = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d');
	my $end_of_day = $start_time->clone()->set(hour => 23, minute => 59, second => 59);

	my $repo = Git::Repository->new(work_tree => $repo_path);
	my @commits = $repo->run('log', '--date=local', '--pretty=%at,%h', "--since=$start_time", "--until=$end_of_day");

	if (@commits) {
		@commits = reverse @commits;
		my @commit_times;
		my @commit_times_full;
		my @commit_hashes;
		my $commits_count = 0;

		foreach my $commit (@commits) {
			my ($timestamp, $hash) = split(/,/, $commit);
			my $commit_time = DateTime->from_epoch(epoch => $timestamp);
			push @commit_times, $commit_time->strftime('%H:%M');
			push @commit_times_full, $commit_time->strftime('%Y-%m-%d %H:%M:%S');
			push @commit_hashes, $hash;
			$commits_count++;
		}

		my $format = DateTime::Format::Strptime->new(
			pattern => '%Y-%m-%d %H:%M:%S',
			on_error => 'croak',
		);

		my $first_commit_time = $commit_times[0];
		my $first_commit_time_full = $format->parse_datetime($commit_times_full[0]);
		my $first_commit_hash = $commit_hashes[0];

		my $last_commit_time = $commit_times[-1];
		my $last_commit_time_full = $format->parse_datetime($commit_times_full[-1]);
		my $last_commit_hash = $commit_hashes[-1];

		my $working_hours = $last_commit_time_full->subtract_datetime($first_commit_time_full);
		my $working_hours_formatted = $working_hours->hours . ':' . sprintf("%02d", $working_hours->minutes);

		$global_working_hours{$current_date} = $working_hours_formatted;

		$total_working_hours += $working_hours->in_units('hours');
		$total_commits_count += $commits_count;

		$csv_timetable->print($timetable_fh, [$current_date, $first_commit_time, $last_commit_time]);
		$csv_table2->print($table2_fh, [$current_date, $working_hours_formatted, $commits_count, $first_commit_hash, $last_commit_hash]);

		push @plot_dates, $current_date;
		push @plot_commits, $commits_count;
	}

	$start_time->add(days => 1);
}

close $timetable_fh;
close $table2_fh;

while ($original_start_time <= $end_time) {
	my $current_month = $original_start_time->strftime('%m');
	my $current_year = $original_start_time->year;

	# Use the control variable to set the output color
	my $color_control = 1;

	my @monate = (
		"Januar",
		"Februar",
		"März",
		"April", 
		"Mai",
		"Juni",
		"Juli",
		"August" ,
		"September", 
		"Oktober", 
		"November", 
		"Dezember" 
	);

	my $monat_name = $monate[$current_month - 1];

	print $monat_name . "\n";

	my @calendar = calendar($current_month, $current_year);

	# Iterate through the days in the calendar
	foreach my $week (@calendar) {
		foreach my $day (@$week) {
			if (defined $day) {
				my $key = sprintf("%4d-%02d-%02d", $current_year, $current_month, $day);
				my $wh = $global_working_hours{$key};
				my $before = " [";
				if($wh) {
					if(length($day) == 1) {
						print $day . $before." ".$wh."] |  ";
					} else {
						print $day . " [".$wh."] |  ";
					}
				} else {
					print $day . " [00] |  ";
				}
			} else {
				print "     |      ";
			}
		}
		print "\n";
	}

	# Increment the month
	$original_start_time->add(months => 1, days => 1);
}

# Output total working hours and commits count
print "Total Working Hours: $total_working_hours hours\n";
print "Total Commits Count: $total_commits_count\n";

# Use Chart::Gnuplot to create a plot
my $chart = Chart::Gnuplot->new(
	output => 'commits_plot.png',
	title  => 'Commits per Day',
	xdata  => 'time',
	xlabel => 'Date',
	ylabel => 'Commits',
	y2label => 'Working Hours'
);
$chart->set('timefmt' => '%Y-%m-%d', 'format x' => '%b %d');
$chart->plot(
	Chart::Gnuplot::DataSet->new(
		xdata => \@plot_dates,
		ydata => \@plot_commits,
		title => 'Commits',
		axis => 'y1',
		style => 'linespoints',
	),
	Chart::Gnuplot::DataSet->new(
		xdata => \@plot_dates,
		ydata => [$total_working_hours] x scalar(@plot_dates),
		title => 'Working Hours',
		axis => 'y2',
		style => 'lines',
	)
);

# Clean up temporary files
#unlink 'timetable.csv';
#unlink 'table2.csv';
