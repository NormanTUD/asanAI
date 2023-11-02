#!/usr/bin/perl
$|++;
use strict;
use warnings;
use POSIX qw/strftime/;
use Git::Repository;
use Text::CSV;
use DateTime;
use DateTime::Format::Strptime;
use Date::Calc qw/Day_of_Week Days_in_Month/;
use Date::Holidays;
use Data::Dumper;
use Term::ANSIColor;
use Text::Table;

sub dier {
	die Dumper \@_;
}

# Set the Git repository paths from the ~/.repos file
my $repos_file = "$ENV{HOME}/.repos";
open my $repos_fh, '<', $repos_file or die "Could not open $repos_file: $!";
my @repos = <$repos_fh>;
chomp(@repos);

# Define the date range
my $start_date = shift || die("No start date given");

my $start_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($start_date);
my $original_start_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($start_date);
my $end_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($start_date);
$end_time->add(months => 1);

if (!$end_time) {
	die("End time could not be found. Is it above the max number of days per month?");
}

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

# Determine holidays (in this case, for Germany)
my $holidays = Date::Holidays->new(
	countrycode => 'DE',
	nocheck    => 1,
	WHERE => ['common', 'sn']
);

# Iterate through each day in the date range
while ($start_time <= $end_time) {
	my $current_date = $start_time->strftime('%Y-%m-%d');
	my $strp = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d');
	my $end_of_day = $start_time->clone()->set(hour => 23, minute => 59, second => 59);

	my @all_commits = ();

	foreach my $repo_path (@repos) {
		print "\b\b\b" x 100;
		print " " x 100;
		print "\b\b\b" x 100;
		print "$start_time - $end_of_day: $repo_path";
		my $repo = Git::Repository->new(work_tree => $repo_path);
		my @commits = $repo->run('log', '--date=local', '--pretty=%at,%h', "--since=$start_time", "--until=$end_of_day");

		push @all_commits, @commits;
	}

	if (@all_commits) {
		@all_commits = reverse @all_commits;
		my @commit_times;
		my @commit_times_full;
		my @commit_hashes;
		my $commits_count = 0;

		foreach my $commit (@all_commits) {
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

# Define the year and month
my $current_year = $original_start_time->year;
my $current_month = $original_start_time->month;

# Clean up temporary files
unlink 'timetable.csv';
unlink 'table2.csv';

# Create a hash of workdays
my %workdays = ();

# Iterate through each day in the month

while ($current_month == $original_start_time->month) {
	my $day = $original_start_time->day;
	my $current_date = $original_start_time->strftime('%Y-%m-%d');
	my $current_month = $original_start_time->strftime('%m');
	my $current_year = $original_start_time->strftime('%Y');
	my $day_of_week = Day_of_Week($current_year, $current_month, $day);

	my $dh = Date::Holidays->new(
		countrycode => 'de'
	);

	my $is_holiday = $dh->is_holiday(
		year      => $current_year,
		month     => $current_month,
		day       => $day,
		regions => ['common', 'sn'],
	);

	# Check if it's a weekend (Saturday or Sunday)
	if ($day_of_week == 6 || $day_of_week == 7) {
		$workdays{$current_date} = 'WEEKEND';
	} elsif ($is_holiday) {
		# Check if it's a holiday
		$workdays{$current_date} = 'HOLIDAY';
	} else {
		# Check for overtime or undertime (assuming 8 hours per day is normal)
		my $working_hours = $global_working_hours{$current_date};
		if ($working_hours) {
			my ($hours, $minutes) = split(':', $working_hours);
			my $total_minutes = $hours * 60 + $minutes;
			if ($total_minutes > 8 * 60) {
				$workdays{$current_date} = 'OVERTIME';
			} elsif ($total_minutes < 8 * 60) {
				$workdays{$current_date} = 'UNDERTIME';
			}
		}
	}

	$original_start_time->add(days => 1);
}

# Reinitialize the start time for printing the calendar
$original_start_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($start_date);

# Create a table for displaying the calendar
my $table = Text::Table->new('DOM, ', 'Day, ', 'Working Hours');
my @weekend_days;
my $number_workdays = 0;

while ($current_month == $original_start_time->month) {
	my $day = $original_start_time->day;
	my $current_date = $original_start_time->strftime('%Y-%m-%d');
	my $day_of_week = Day_of_Week($current_year, $current_month, $day);

	my $color = 'reset';

	# Determine the color based on workday type
	if (exists $workdays{$current_date}) {
		if ($workdays{$current_date} eq 'WEEKEND') {
			$color = 'green';
			push @weekend_days, [$day, $global_working_hours{$current_date} || '0:00'];
		} elsif ($workdays{$current_date} eq 'HOLIDAY') {
			$color = 'on_blue';
		} else {
			if ($workdays{$current_date} eq 'OVERTIME') {
				$color = 'on_green';
			} elsif ($workdays{$current_date} eq 'UNDERTIME') {
				$color = 'on_red';
			}

			$number_workdays++;
		}
	}

	# Calculate the working hours for the day
	my $working_hours = $global_working_hours{$current_date} || '0:00';

	my @dow_to_d = qw/So Mo Di Mi Do Fr Sa Sa/;

	my $dow = $dow_to_d[$day_of_week];

	my $colored_text = colored($working_hours, $color);

	if($dow =~ m#^S[ao]$#) {
		$colored_text = colored($colored_text, "underline");
	}

	# Add day and working hours to the table
	$table->add($day, $dow, $colored_text);

	# Increment the day
	$original_start_time->add(days => 1);
}

my $expected_working_hours = $number_workdays * 8;

# Output total working hours and commits count
print "\n";
print "Work days: $number_workdays\n";
print "Expected working hours: $expected_working_hours hours\n";
print "Total Working Hours: $total_working_hours hours\n";
my $over_or_undertime = $expected_working_hours - $total_working_hours;

if($over_or_undertime > 0) {
	my $overtime = $expected_working_hours - $total_working_hours;
	print "Overtime $overtime hours\n";
} elsif ($over_or_undertime < 0) {
	my $undertime = $total_working_hours - $expected_working_hours;
	print "Overtime $undertime hours\n";
} else {
	print "Neither over nor under time\n";
}
print "Total Commits Count: $total_commits_count\n";

# Print any remaining days at the end of the month
if ($table->body() || @weekend_days) {
	print colored(colored("Wochenende", "green"), "underline")."\n";
	print colored("Feiertag", "on_blue")."\n";
	print colored("Überstunden", "on_green")."\n";
	print colored("Unterstunden", "on_red")."\n";
	print colored("Wochenende", "underline")."\n";

	print $table;
	print "\n";
}
